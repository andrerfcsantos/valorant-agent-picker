import { describe, expect, test } from "vite-plus/test";
import { tryDecodeShare } from "@/lib/share/codec";
import { readShareParam, sharePath } from "@/lib/share/urls";
import { slotNarrows } from "./squadService";

describe("slotNarrows", () => {
  test("only a non-empty selection narrows the roster", () => {
    expect(slotNarrows(null)).toBe(false);
    expect(slotNarrows([])).toBe(false);
    expect(slotNarrows(["jett"])).toBe(true);
  });

  test("a player shared with nothing selected still rolls from everyone", () => {
    const path = sharePath({
      kind: "squad-result",
      squad: { size: 1, slots: [[], null, null, null, null], names: [] },
      result: { agents: ["jett"] },
    });
    const decoded = tryDecodeShare(
      readShareParam(path.slice(path.indexOf("?"))),
    );
    expect(decoded.ok).toBe(true);
    if (!decoded.ok || decoded.payload.kind !== "squad-result") return;
    expect(decoded.payload.squad.slots[0]).toEqual([]);
    expect(decoded.payload.squad.slots.some(slotNarrows)).toBe(false);
  });
});
