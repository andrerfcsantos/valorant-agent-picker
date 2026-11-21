/** How the selection differs from the preset it came from. */
export interface PresetChanges {
  added: string[];
  removed: string[];
}

/** The agents added to and removed from `preset` to get to `selected`. */
export function presetChanges(
  preset: string[],
  selected: string[],
): PresetChanges {
  const before = new Set(preset);
  const after = new Set(selected);
  return {
    added: selected.filter((key) => !before.has(key)),
    removed: preset.filter((key) => !after.has(key)),
  };
}
