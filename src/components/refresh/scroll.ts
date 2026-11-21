/**
 * Brings a result back into view when the visitor rolled from further down
 * the page. On a phone the roll button is fixed to the bottom of the screen
 * and the result is at the top, so a roll made while editing the pool would
 * otherwise change something nobody can see. On wider screens the result
 * sticks in its rail, is never above the viewport, and nothing moves.
 */
export function bringResultIntoView(element: HTMLElement | null): void {
  if (!element || element.getBoundingClientRect().top >= 0) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  });
}
