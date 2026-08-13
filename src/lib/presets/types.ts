/**
 * A named agent selection the visitor can re-apply in one click.
 *
 * Presets deliberately carry filters only, not the picker's options: applying
 * one should never move a checkbox the visitor set for themselves.
 */
export interface SavedPreset {
  id: string;
  name: string;
  /** Agent keys the preset selects. */
  agents: string[];
}

/** How many presets get a number shortcut, in list order. */
export const SHORTCUT_COUNT = 10;

/**
 * The key that applies the preset at `index`, or null past the shortcut range.
 * The tenth preset gets `0`, which is where the row of number keys ends.
 */
export function shortcutForIndex(index: number): string | null {
  if (index < 0 || index >= SHORTCUT_COUNT) return null;
  return String((index + 1) % 10);
}
