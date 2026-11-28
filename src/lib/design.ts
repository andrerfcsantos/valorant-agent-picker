/**
 * The site wears one of two designs: the new one, which is the default, and
 * the classic one, kept for now for visitors who prefer it. Every visitor can
 * move between them whenever they like. This module is the
 * single place that knows which design applies; nothing else reads the
 * storage key.
 */
export const DESIGNS = ["classic", "refresh"] as const;

export type Design = (typeof DESIGNS)[number];

/** Where a visitor's own choice is kept. */
export const DESIGN_STORAGE_KEY = "design";

/** Set once the notice that the classic design is going away has been closed. */
export const DESIGN_CLASSIC_NOTICE_DISMISSED_KEY =
  "designClassicNoticeDismissed";

/** Set once the request for feedback on the new design has been closed. */
export const DESIGN_FEEDBACK_DISMISSED_KEY = "designFeedbackDismissed";

/** Where feedback on the new design goes. */
export const FEEDBACK_URL = "https://discord.gg/2yb3ZPzjve";

export function isDesign(value: unknown): value is Design {
  return DESIGNS.some((design) => design === value);
}

/**
 * What a visitor sees before they have chosen. Set at build time with
 * `NEXT_PUBLIC_DEFAULT_DESIGN`, so flipping the default is a redeploy rather
 * than a code change.
 */
export const DEFAULT_DESIGN: Design = isDesign(
  process.env.NEXT_PUBLIC_DEFAULT_DESIGN,
)
  ? process.env.NEXT_PUBLIC_DEFAULT_DESIGN
  : "refresh";

export interface DesignChoice {
  design: Design;
  /** True when the visitor picked it, false when it is just the default. */
  chosen: boolean;
}

type DesignStorage = Pick<Storage, "getItem" | "setItem">;

/** The browser's storage, or null where there is none to use. */
function defaultStorage(): DesignStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Storage can be blocked outright, in which case the getter throws.
    return null;
  }
}

/** The design to show, and whether the visitor asked for it. Never throws. */
export function readDesignChoice(
  storage: DesignStorage | null = defaultStorage(),
): DesignChoice {
  try {
    const stored = storage?.getItem(DESIGN_STORAGE_KEY);
    if (isDesign(stored)) return { design: stored, chosen: true };
  } catch {
    // Fall through to the default.
  }
  return { design: DEFAULT_DESIGN, chosen: false };
}

/** Best effort: without storage the choice only lasts for the visit. */
export function storeDesign(
  design: Design,
  storage: DesignStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(DESIGN_STORAGE_KEY, design);
  } catch {
    // Quota or privacy settings; nothing useful to do.
  }
}

/**
 * Runs in `<head>` before the first paint. The site is a static export, so
 * the server cannot know the visitor's design; this stamps it on `<html>`
 * early enough that the navbar and page background never flash the wrong one.
 * It repeats {@link readDesignChoice} in plain JavaScript because it runs
 * before any module has loaded. Both designs use the same fonts, which the
 * layout preloads for everyone, so there is nothing else to fetch here.
 */
export const DESIGN_BOOT_SCRIPT = `(function(){var d=${JSON.stringify(DEFAULT_DESIGN)};try{var s=localStorage.getItem(${JSON.stringify(DESIGN_STORAGE_KEY)});if(${DESIGNS.map((design) => `s===${JSON.stringify(design)}`).join("||")})d=s}catch(e){}document.documentElement.dataset.design=d})();`;
