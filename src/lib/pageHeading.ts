/**
 * Moves focus to the page's main heading. For a control that removes itself
 * along with whatever it belonged to (a banner's close button), which would
 * otherwise drop keyboard focus on <body>. Waits a frame, so a page that
 * renders in response finds its heading in place.
 */
export function focusPageHeading(): void {
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;
    // Focusable from script only, so it never joins the tab order.
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus();
  });
}
