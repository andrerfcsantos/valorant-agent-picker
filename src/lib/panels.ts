/**
 * The picker's panels that a link can open. While one is open its name is in
 * the address bar, so a copied link opens the same panel for whoever follows
 * it: `/?panel=presets` lands on the preset manager.
 */

/** Query parameter naming the open panel. */
export const PANEL_PARAM = "panel";

export const PANELS = ["presets"] as const;
export type Panel = (typeof PANELS)[number];

/** The panel a query string asks for, or null for none or one we don't have. */
export function readPanel(search: string): Panel | null {
  const value = new URLSearchParams(search).get(PANEL_PARAM);
  return PANELS.find((panel) => panel === value) ?? null;
}

/**
 * Names `panel` in the address bar, or takes it out when it is null. It
 * replaces the current entry rather than adding one: opening a panel is not a
 * page to go back to.
 */
export function writePanel(panel: Panel | null): void {
  const url = new URL(window.location.href);
  if (panel) url.searchParams.set(PANEL_PARAM, panel);
  else url.searchParams.delete(PANEL_PARAM);
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

/** Takes `panel` out of the address bar, unless another one replaced it. */
export function clearPanel(panel: Panel): void {
  if (readPanel(window.location.search) === panel) writePanel(null);
}
