import { describe, expect, test } from "vite-plus/test";

import { bytesToBase64Url, checksum8 } from "./binary";
import {
  MAX_NAME_LENGTH,
  decodeShare,
  encodeShare,
  tryDecodeShare,
} from "./codec";
import { SHARE_AGENT_ORDER } from "./agentOrder";
import { PickerPreset, SharePayload, SquadPreset } from "./types";

const picker: PickerPreset = {
  selected: ["jett", "sage", "omen"],
  showPortrait: true,
  nonRepeating: false,
};

const squad: SquadPreset = {
  size: 5,
  // Slot masks decode in share-table order, so fixtures that are compared with
  // toEqual after a round trip have to be written in that order already.
  slots: [null, ["cypher", "sage"], null, null, null],
  names: ["", "", "", "", ""],
};

/** Builds a blob from raw body bytes, appending the checksum the codec expects. */
function blobFrom(body: number[]): string {
  const bytes = Uint8Array.from([...body, checksum8(Uint8Array.from(body))]);
  return bytesToBase64Url(bytes);
}

function roundTrip(payload: SharePayload): SharePayload {
  return decodeShare(encodeShare(payload));
}

describe("share codec", () => {
  test("round-trips a picker preset", () => {
    expect(roundTrip({ kind: "picker-preset", picker })).toEqual({
      kind: "picker-preset",
      // Decoding returns keys in share-table order, not the order given.
      picker: { ...picker, selected: ["jett", "omen", "sage"] },
    });
  });

  test("round-trips an agent result", () => {
    const decoded = roundTrip({
      kind: "agent-result",
      picker,
      result: { agentKey: "jett" },
    });
    expect(decoded.kind).toBe("agent-result");
    expect(decoded).toMatchObject({ result: { agentKey: "jett" } });
  });

  test("round-trips an empty slot in an agent result", () => {
    expect(
      roundTrip({
        kind: "agent-result",
        picker,
        result: { agentKey: null },
      }),
    ).toMatchObject({ result: { agentKey: null } });
  });

  test("preserves an empty selection", () => {
    const decoded = roundTrip({
      kind: "picker-preset",
      picker: { ...picker, selected: [] },
    });
    expect(decoded).toMatchObject({ picker: { selected: [] } });
  });

  test("preserves a full selection", () => {
    const all = [...SHARE_AGENT_ORDER];
    const decoded = roundTrip({
      kind: "picker-preset",
      picker: { ...picker, selected: all },
    });
    expect(decoded).toMatchObject({ picker: { selected: all } });
  });

  test("round-trips the picker options", () => {
    const decoded = roundTrip({
      kind: "picker-preset",
      picker: { ...picker, showPortrait: false, nonRepeating: true },
    });
    expect(decoded).toMatchObject({
      picker: { showPortrait: false, nonRepeating: true },
    });
  });

  test("round-trips a squad result with filters and names", () => {
    const payload: SharePayload = {
      kind: "squad-result",
      squad: { ...squad, names: ["Andre", "", "Sam", "", ""] },
      result: { agents: ["jett", "sage", null, "omen", "raze"] },
    };
    expect(roundTrip(payload)).toEqual(payload);
  });

  test("keeps unrestricted slots distinct from fully-disabled ones", () => {
    const decoded = roundTrip({
      kind: "squad-preset",
      squad: { ...squad, slots: [null, [], null, null, null] },
    });
    expect(decoded).toMatchObject({
      squad: { slots: [null, [], null, null, null] },
    });
  });

  test("carries slot filters beyond the current squad size", () => {
    const decoded = roundTrip({
      kind: "squad-preset",
      squad: { ...squad, size: 2, slots: [null, null, null, null, ["viper"]] },
    });
    expect(decoded).toMatchObject({
      squad: { size: 2, slots: [null, null, null, null, ["viper"]] },
    });
  });

  test("trims and caps player names", () => {
    const long = "x".repeat(MAX_NAME_LENGTH + 10);
    const decoded = roundTrip({
      kind: "squad-preset",
      squad: { ...squad, names: ["  spaced  ", long, "", "", ""] },
    });
    expect(decoded).toMatchObject({
      squad: { names: ["spaced", "x".repeat(MAX_NAME_LENGTH), "", "", ""] },
    });
  });

  test("handles non-ascii names", () => {
    const decoded = roundTrip({
      kind: "squad-preset",
      squad: { ...squad, names: ["Jörn 🔫", "", "", "", ""] },
    });
    expect(decoded).toMatchObject({
      squad: { names: ["Jörn 🔫", "", "", "", ""] },
    });
  });

  test("leaks no agent names into the encoded link", () => {
    const encoded = encodeShare({
      kind: "agent-result",
      picker,
      result: { agentKey: "jett" },
    });
    expect(encoded.toLowerCase()).not.toContain("jett");
  });

  test("keeps links short", () => {
    const agentLink = encodeShare({
      kind: "agent-result",
      picker,
      result: { agentKey: "jett" },
    });
    const squadLink = encodeShare({
      kind: "squad-result",
      squad,
      result: { agents: ["jett", "sage", "omen", "raze", "viper"] },
    });
    expect(agentLink.length).toBeLessThanOrEqual(24);
    expect(squadLink.length).toBeLessThanOrEqual(48);
  });
});

describe("share codec failure handling", () => {
  test("rejects a payload that is not base64url", () => {
    expect(tryDecodeShare("not valid!!")).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  test("rejects an empty payload", () => {
    expect(tryDecodeShare(null)).toEqual({ ok: false, reason: "malformed" });
    expect(tryDecodeShare("")).toEqual({ ok: false, reason: "malformed" });
  });

  test("rejects a truncated payload", () => {
    const encoded = encodeShare({ kind: "picker-preset", picker });
    expect(tryDecodeShare(encoded.slice(0, 4)).ok).toBe(false);
  });

  test("detects a mangled character instead of decoding a different agent", () => {
    const encoded = encodeShare({
      kind: "agent-result",
      picker,
      result: { agentKey: "jett" },
    });
    const swapped = encoded[0] === "A" ? "B" : "A";
    const mangled = swapped + encoded.slice(1);
    expect(tryDecodeShare(mangled).ok).toBe(false);
  });

  test("reports a newer format version distinctly", () => {
    // version 2, kind 0 (agent-result)
    expect(tryDecodeShare(blobFrom([0x20, 0x00, 0x00]))).toEqual({
      ok: false,
      reason: "unsupported-version",
    });
  });

  test("rejects an unknown kind", () => {
    expect(tryDecodeShare(blobFrom([0x1f, 0x00, 0x00]))).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  test("treats agents missing from an older, shorter mask as unselected", () => {
    // picker-preset, no flags, 1-byte mask selecting share indices 0 and 2.
    const decoded = decodeShare(blobFrom([0x12, 0x00, 0x01, 0b00000101]));
    expect(decoded).toEqual({
      kind: "picker-preset",
      picker: {
        selected: [SHARE_AGENT_ORDER[0], SHARE_AGENT_ORDER[2]],
        showPortrait: false,
        nonRepeating: false,
      },
    });
  });

  test("ignores mask bits for agents this build does not know", () => {
    const overlong = Array.from({ length: 16 }, () => 0xff);
    const decoded = decodeShare(
      blobFrom([0x12, 0x00, overlong.length, ...overlong]),
    );
    expect(decoded).toMatchObject({
      picker: { selected: [...SHARE_AGENT_ORDER] },
    });
  });
});
