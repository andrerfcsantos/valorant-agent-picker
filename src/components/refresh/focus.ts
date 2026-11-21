import type { RefObject } from "react";

/**
 * A ref callback for a control that goes away once it has done its job
 * ("Select all" once everything is selected). If it is removed while it has
 * focus, by its own click or by a keyboard shortcut, focus moves to `next()`
 * instead of falling to the page. `own`, if given, is pointed at the control
 * too, for the controls that are each other's `next`.
 */
export function handOffFocus(
  next: () => HTMLElement | null | undefined,
  own?: RefObject<HTMLElement | null>,
) {
  return (node: HTMLElement | null) => {
    if (!node) return;
    if (own) own.current = node;
    // Runs before the node leaves the document, so it can still tell whether
    // the node has focus. Also runs on each re-render, while it stays.
    return () => {
      if (own && own.current === node) own.current = null;
      if (document.activeElement !== node) return;
      // After the commit, when whatever replaces the node is in place.
      queueMicrotask(() => {
        if (node.isConnected) return;
        const active = document.activeElement;
        if (active && active !== document.body) return;
        next()?.focus();
      });
    };
  };
}
