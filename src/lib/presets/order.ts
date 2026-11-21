import { SavedPreset } from "./types";

/**
 * Puts `preset` back in `presets` just below the preset `afterId`, or at the
 * top when that is null or no longer in the list. This is how a delete is
 * undone.
 *
 * A preset already in the list with the same id gives way to it. That only
 * happens to a built-in preset restored after it was deleted: the restored
 * one is the stock version, and the one being put back is the visitor's own,
 * with whatever they had renamed or changed, so theirs is the one kept.
 */
export function insertAfter(
  presets: SavedPreset[],
  preset: SavedPreset,
  afterId: string | null,
): SavedPreset[] {
  const next = presets.filter((existing) => existing.id !== preset.id);
  const anchor = afterId
    ? next.findIndex((existing) => existing.id === afterId)
    : -1;
  next.splice(anchor + 1, 0, preset);
  return next;
}

/**
 * Puts back every built-in preset missing from `presets`. Each comes back as
 * stock, at the end of the list, except one deleted just now (`deleted`),
 * which comes back the way it was when it was deleted, in its place, as an
 * undo would bring it: restoring it as stock would throw away whatever the
 * visitor had made of it.
 */
export function restoreBuiltIns(
  presets: SavedPreset[],
  builtIns: SavedPreset[],
  deleted: { preset: SavedPreset; afterId: string | null } | null,
): SavedPreset[] {
  const present = new Set(presets.map((preset) => preset.id));
  const putBack =
    deleted &&
    !present.has(deleted.preset.id) &&
    builtIns.some((preset) => preset.id === deleted.preset.id);
  const next = putBack
    ? insertAfter(presets, deleted.preset, deleted.afterId)
    : presets;
  const have = new Set(next.map((preset) => preset.id));
  const missing = builtIns.filter((preset) => !have.has(preset.id));
  return missing.length ? [...next, ...missing] : next;
}
