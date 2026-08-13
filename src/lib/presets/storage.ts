import { AGENTS } from "@/data/agents";
import { getJsonFromLS, setJsonToLS } from "@/lib/localStorage";
import { buildDefaultPresets } from "./defaults";
import { SavedPreset } from "./types";

const STORAGE_KEY = "presets";
const VERSION = 1;

interface PresetsFile {
  version: number;
  presets: SavedPreset[];
  /** The preset the current filters came from, so the chip stays lit on reload. */
  appliedId: string | null;
}

export interface PresetsState {
  presets: SavedPreset[];
  appliedId: string | null;
}

/**
 * Stored presets are read back defensively: the file survives across agent
 * roster changes and can be edited by hand, so anything unrecognisable is
 * dropped rather than trusted.
 */
function parsePreset(value: unknown): SavedPreset | null {
  if (typeof value !== "object" || value === null) return null;
  const { id, name, agents } = value as Partial<SavedPreset>;
  if (typeof id !== "string" || !id) return null;
  if (typeof name !== "string") return null;
  if (!Array.isArray(agents)) return null;
  return {
    id,
    name,
    // Agents that no longer exist are dropped; ones added to the game since the
    // preset was saved are simply not part of it.
    agents: agents.filter(
      (key): key is string => typeof key === "string" && key in AGENTS,
    ),
  };
}

/**
 * Reads the saved presets, seeding the built-in ones on a first visit. An empty
 * list is a real state — someone who deleted every preset gets none back.
 */
export function loadPresets(): PresetsState {
  const file = getJsonFromLS<Partial<PresetsFile>>(STORAGE_KEY);

  if (!file || !Array.isArray(file.presets)) {
    return { presets: buildDefaultPresets(), appliedId: null };
  }

  const presets: SavedPreset[] = [];
  const seen = new Set<string>();
  for (const entry of file.presets) {
    const preset = parsePreset(entry);
    if (preset && !seen.has(preset.id)) {
      seen.add(preset.id);
      presets.push(preset);
    }
  }

  const appliedId =
    typeof file.appliedId === "string" && seen.has(file.appliedId)
      ? file.appliedId
      : null;

  return { presets, appliedId };
}

export function savePresets(state: PresetsState): void {
  const file: PresetsFile = {
    version: VERSION,
    presets: state.presets,
    appliedId: state.appliedId,
  };
  setJsonToLS(STORAGE_KEY, file);
}
