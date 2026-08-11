/**
 * Share link codec.
 *
 * Everything is packed into one opaque base64url blob so a link never spoils
 * the agent it points at: there are no names in the payload, only bit offsets
 * and indices into {@link SHARE_AGENT_ORDER}. That is obfuscation, not secrecy —
 * the table ships in the bundle — but it is enough that a link pasted in chat
 * gives nothing away.
 *
 * Layout (all little-endian bit order, LSB first within a byte):
 *
 *   header  1 byte    version (high nibble) | kind (low nibble)
 *   body    ...       see writePicker / writeSquad
 *   check   1 byte    FNV-1a folded to 8 bits over everything before it
 *
 * The flag bytes deliberately leave gaps: this is the same layout the Overwatch
 * Hero Picker uses, and the unused bits are the ones that game needs for perks
 * and role-composition forcing. Keeping them reserved means the two codecs stay
 * shape-compatible and a future Valorant option can take a gap instead of a
 * version bump.
 *
 * Growing the format:
 *   - New agents just append to SHARE_AGENT_ORDER; masks are length-prefixed, so
 *     old links carry a shorter mask and the missing tail reads as "disabled".
 *     A longer mask from a newer build has its extra bits ignored.
 *   - Past the reserved flag bits or the index ceiling, bump SHARE_VERSION and
 *     branch in the readers.
 */
import { MAX_SLOTS } from "@/lib/squadService";
import {
  ByteReader,
  ByteWriter,
  ShareDecodeError,
  ShareErrorReason,
  base64UrlToBytes,
  bytesToBase64Url,
  checksum8,
  decodeText,
  encodeText,
} from "./binary";
import {
  NO_AGENT_INDEX,
  SHARE_AGENT_ORDER,
  agentKeyAt,
  agentMaskByteLength,
  shareIndexOf,
} from "./agentOrder";
import {
  AgentResult,
  PickerPreset,
  ShareKind,
  SharePayload,
  SquadPreset,
  SquadResult,
} from "./types";

export const SHARE_VERSION = 1;

/** Player names are echoed on a public-looking page, so keep them short. */
export const MAX_NAME_LENGTH = 24;

const KIND_CODES: Record<ShareKind, number> = {
  "agent-result": 0,
  "squad-result": 1,
  "picker-preset": 2,
  "squad-preset": 3,
};

const KIND_BY_CODE: Record<number, ShareKind> = {
  0: "agent-result",
  1: "squad-result",
  2: "picker-preset",
  3: "squad-preset",
};

const PICKER_SHOW_PORTRAIT = 1 << 0;
// 1 << 1 and 1 << 3 reserved (perk options in the Overwatch layout).
const PICKER_NON_REPEATING = 1 << 2;

const SQUAD_SIZE_MASK = 0b111;
// 1 << 3 .. 1 << 5 reserved (role forcing and perks in the Overwatch layout).
const SQUAD_HAS_NAMES = 1 << 6;

function writeAgentMask(writer: ByteWriter, keys: readonly string[]): void {
  const bytes = new Uint8Array(agentMaskByteLength());
  for (const key of keys) {
    const index = shareIndexOf(key);
    if (index === undefined) continue;
    bytes[index >> 3] |= 1 << (index & 7);
  }
  writer.blob(bytes);
}

function readAgentMask(reader: ByteReader): string[] {
  const bytes = reader.blob();
  const keys: string[] = [];
  for (let i = 0; i < SHARE_AGENT_ORDER.length; i++) {
    const byte = bytes[i >> 3];
    // Shorter mask: written before these agents existed, so they stay off.
    if (byte === undefined) break;
    if (byte & (1 << (i & 7))) keys.push(SHARE_AGENT_ORDER[i]);
  }
  return keys;
}

function writeAgentIndex(writer: ByteWriter, agentKey: string | null): void {
  const index = agentKey === null ? undefined : shareIndexOf(agentKey);
  writer.u8(index ?? NO_AGENT_INDEX);
}

function readAgentIndex(reader: ByteReader): string | null {
  const index = reader.u8();
  if (index === NO_AGENT_INDEX) return null;
  // Unknown index: an agent this bundle does not know about yet.
  return agentKeyAt(index) ?? null;
}

function writePicker(
  writer: ByteWriter,
  preset: PickerPreset,
  result?: AgentResult,
): void {
  let flags = 0;
  if (preset.showPortrait) flags |= PICKER_SHOW_PORTRAIT;
  if (preset.nonRepeating) flags |= PICKER_NON_REPEATING;
  writer.u8(flags);

  writeAgentMask(writer, preset.selected);

  if (result) writeAgentIndex(writer, result.agentKey);
}

function readPicker(
  reader: ByteReader,
  withResult: boolean,
): { picker: PickerPreset; result: AgentResult | null } {
  const flags = reader.u8();
  const picker: PickerPreset = {
    showPortrait: (flags & PICKER_SHOW_PORTRAIT) !== 0,
    nonRepeating: (flags & PICKER_NON_REPEATING) !== 0,
    selected: readAgentMask(reader),
  };

  if (!withResult) return { picker, result: null };

  return { picker, result: { agentKey: readAgentIndex(reader) } };
}

function normalizeNames(names: string[]): string[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) =>
    (names[i] ?? "").trim().slice(0, MAX_NAME_LENGTH),
  );
}

function clampSize(size: number): number {
  if (!Number.isFinite(size)) return MAX_SLOTS;
  return Math.min(MAX_SLOTS, Math.max(1, Math.trunc(size)));
}

function writeSquad(
  writer: ByteWriter,
  preset: SquadPreset,
  result?: SquadResult,
): void {
  const size = clampSize(preset.size);
  const names = normalizeNames(preset.names);
  const hasNames = names.some((name) => name.length > 0);

  let flags = (size - 1) & SQUAD_SIZE_MASK;
  if (hasNames) flags |= SQUAD_HAS_NAMES;
  writer.u8(flags);

  // All slots are carried, not just the visible ones, so filters survive a
  // size change after the link is opened. Unrestricted slots cost nothing.
  let slotBitmap = 0;
  for (let i = 0; i < MAX_SLOTS; i++) {
    if (preset.slots[i]) slotBitmap |= 1 << i;
  }
  writer.u8(slotBitmap);
  for (let i = 0; i < MAX_SLOTS; i++) {
    const enabled = preset.slots[i];
    if (enabled) writeAgentMask(writer, enabled);
  }

  if (result) {
    for (let i = 0; i < size; i++) {
      writeAgentIndex(writer, result.agents[i] ?? null);
    }
  }

  if (hasNames) {
    for (const name of names) writer.blob(encodeText(name));
  }
}

function readSquad(
  reader: ByteReader,
  withResult: boolean,
): { squad: SquadPreset; result: SquadResult | null } {
  const flags = reader.u8();
  const size = (flags & SQUAD_SIZE_MASK) + 1;

  const slotBitmap = reader.u8();
  const slots: (string[] | null)[] = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push((slotBitmap & (1 << i)) !== 0 ? readAgentMask(reader) : null);
  }

  let result: SquadResult | null = null;
  if (withResult) {
    const agents: (string | null)[] = [];
    for (let i = 0; i < size; i++) agents.push(readAgentIndex(reader));
    result = { agents };
  }

  const names =
    (flags & SQUAD_HAS_NAMES) !== 0
      ? Array.from({ length: MAX_SLOTS }, () => decodeText(reader.blob()))
      : Array.from({ length: MAX_SLOTS }, () => "");

  return { squad: { size, slots, names }, result };
}

export function encodeShare(payload: SharePayload): string {
  const writer = new ByteWriter();
  writer.u8((SHARE_VERSION << 4) | KIND_CODES[payload.kind]);

  switch (payload.kind) {
    case "picker-preset":
      writePicker(writer, payload.picker);
      break;
    case "agent-result":
      writePicker(writer, payload.picker, payload.result);
      break;
    case "squad-preset":
      writeSquad(writer, payload.squad);
      break;
    case "squad-result":
      writeSquad(writer, payload.squad, payload.result);
      break;
  }

  const body = writer.toBytes();
  const bytes = new Uint8Array(body.length + 1);
  bytes.set(body);
  bytes[body.length] = checksum8(body);
  return bytesToBase64Url(bytes);
}

export function decodeShare(value: string): SharePayload {
  const bytes = base64UrlToBytes(value);
  if (bytes.length < 2) {
    throw new ShareDecodeError("malformed", "share data is too short");
  }

  const body = bytes.subarray(0, bytes.length - 1);
  if (checksum8(body) !== bytes[bytes.length - 1]) {
    throw new ShareDecodeError("corrupt", "share data failed its checksum");
  }

  const reader = new ByteReader(body);
  const header = reader.u8();
  const version = header >> 4;
  if (version > SHARE_VERSION) {
    throw new ShareDecodeError(
      "unsupported-version",
      `share data uses format version ${version}`,
    );
  }
  if (version !== SHARE_VERSION) {
    throw new ShareDecodeError("malformed", "unknown share format version");
  }

  const kind = KIND_BY_CODE[header & 0x0f];
  if (!kind) {
    throw new ShareDecodeError("malformed", "unknown share kind");
  }

  switch (kind) {
    case "picker-preset": {
      const { picker } = readPicker(reader, false);
      return { kind, picker };
    }
    case "agent-result": {
      const { picker, result } = readPicker(reader, true);
      return { kind, picker, result: result! };
    }
    case "squad-preset": {
      const { squad } = readSquad(reader, false);
      return { kind, squad };
    }
    case "squad-result": {
      const { squad, result } = readSquad(reader, true);
      return { kind, squad, result: result! };
    }
  }
}

export type ShareDecodeResult =
  | { ok: true; payload: SharePayload }
  | { ok: false; reason: ShareErrorReason };

/** Non-throwing {@link decodeShare} for rendering paths. */
export function tryDecodeShare(value: string | null): ShareDecodeResult {
  if (!value) return { ok: false, reason: "malformed" };
  try {
    return { ok: true, payload: decodeShare(value) };
  } catch (error) {
    if (error instanceof ShareDecodeError) {
      return { ok: false, reason: error.reason };
    }
    return { ok: false, reason: "malformed" };
  }
}
