/** Below this width the roll button is fixed to the bottom of the screen. */
const FIXED_ROLL_BAR = "(max-width: 63.99rem)";

/**
 * Brings a result back into view when the visitor rolled from further down
 * the page. On a phone the roll button is fixed to the bottom of the screen
 * and the results are above, so a roll made while editing a pool would
 * otherwise change something nobody can see. On wider screens the button
 * sits beside the results, and the page is left where the visitor put it.
 */
export function bringResultIntoView(element: HTMLElement | null): void {
  if (!element || !window.matchMedia(FIXED_ROLL_BAR).matches) return;
  if (element.getBoundingClientRect().top >= 0) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  });
}
