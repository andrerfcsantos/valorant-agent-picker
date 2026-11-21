import { type RefObject, useEffect, useRef } from "react";

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
  // Only for a roll made from the bar, from the result itself (a player's
  // own reroll), or by a tap that leaves nothing focused. A keyboard
  // shortcut pressed while focus is somewhere else on the page keeps the
  // visitor where they are, with their focus still on screen.
  const active = document.activeElement;
  const fromElsewhere =
    active instanceof HTMLElement &&
    active !== document.body &&
    !active.closest("[data-roll-bar]") &&
    !element.contains(active);
  if (fromElsewhere) return;
  // In view means the result itself (the agent's name, the first player's
  // agent, marked data-result) shows in full between the top of the screen
  // and the fixed bar. Setup above the results can push them under the bar
  // as easily as scrolling down can leave them above.
  const result = element.querySelector<HTMLElement>("[data-result]") ?? element;
  const { top, bottom } = result.getBoundingClientRect();
  const bar = document.querySelector("[data-roll-bar]");
  const floor = bar ? bar.getBoundingClientRect().top : window.innerHeight;
  if (top >= 0 && bottom <= floor) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  });
}

/**
 * Calls {@link bringResultIntoView} on `ref` whenever `trigger` changes, but
 * not for the value it mounts with: a view that mounts after a design switch
 * already has its rolls counted, and switching design is not a roll.
 */
export function useResultIntoView(
  ref: RefObject<HTMLElement | null>,
  trigger: string | number,
): void {
  const seen = useRef(trigger);
  useEffect(() => {
    if (seen.current === trigger) return;
    seen.current = trigger;
    bringResultIntoView(ref.current);
  }, [ref, trigger]);
}
