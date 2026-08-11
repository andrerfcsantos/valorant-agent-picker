/**
 * Stable index space for share links.
 *
 * Share links encode agent sets as bitmasks and agent results as indices into
 * this array, so its order is part of the URL format. It is APPEND-ONLY:
 *
 *   - Never reorder entries.
 *   - Never remove entries. If an agent leaves the game, keep its slot so old
 *     links keep decoding; `getAllAgents()` no longer listing it is enough.
 *   - New agents go at the END, regardless of where they sit in `agents.ts`.
 *
 * `agents.test.ts` pins the existing prefix and fails if this is violated.
 *
 * Indices up to 254 are addressable (255 is reserved as the "no agent" marker).
 * If the roster ever passes that, bump SHARE_VERSION and switch to varints.
 */
export const SHARE_AGENT_ORDER: readonly string[] = [
  "breach",
  "brimstone",
  "cypher",
  "jett",
  "omen",
  "phoenix",
  "sage",
  "sova",
  "viper",
  "raze",
  "reyna",
  "killjoy",
  "skye",
  "yoru",
  "astra",
  "kayo",
  "chamber",
  "neon",
  "fade",
  "harbor",
  "gekko",
  "deadlock",
  "iso",
  "clove",
  "vyse",
  "tejo",
  "waylay",
  "veto",
  "miks",
];

/** Marker byte for "no agent in this slot". */
export const NO_AGENT_INDEX = 0xff;

const indexByKey = new Map<string, number>(
  SHARE_AGENT_ORDER.map((key, index) => [key, index]),
);

/** Share index for an agent key, or `undefined` if the agent is not in the table. */
export function shareIndexOf(agentKey: string): number | undefined {
  return indexByKey.get(agentKey);
}

/** Agent key for a share index, or `undefined` if out of range. */
export function agentKeyAt(index: number): string | undefined {
  return SHARE_AGENT_ORDER[index];
}

/** Bytes needed to hold one bit per agent in the current table. */
export function agentMaskByteLength(): number {
  return Math.ceil(SHARE_AGENT_ORDER.length / 8);
}
