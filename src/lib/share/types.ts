export type ShareKind =
  | "agent-result"
  | "squad-result"
  | "picker-preset"
  | "squad-preset";

/** Filters and options from the single-agent picker. */
export interface PickerPreset {
  /** Exact selection state. Empty means "nothing selected", which the picker treats as "all agents". */
  selected: string[];
  showPortrait: boolean;
  nonRepeating: boolean;
}

export interface AgentResult {
  agentKey: string | null;
}

/** Filters and options from the squad generator. */
export interface SquadPreset {
  /** 1-5. */
  size: number;
  /** Enabled agents per slot, `null` for an unrestricted slot. One entry per slot. */
  slots: (string[] | null)[];
  /** Player names per slot, empty string when unset. */
  names: string[];
}

export interface SquadResult {
  /** One entry per slot up to the preset size, `null` for an empty slot. */
  agents: (string | null)[];
}

/**
 * A result payload is a preset payload plus the roll it produced, which is what
 * lets the share page re-roll using the original filters.
 */
export type SharePayload =
  | { kind: "picker-preset"; picker: PickerPreset }
  | { kind: "agent-result"; picker: PickerPreset; result: AgentResult }
  | { kind: "squad-preset"; squad: SquadPreset }
  | { kind: "squad-result"; squad: SquadPreset; result: SquadResult };
