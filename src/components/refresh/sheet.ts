import type { MouseEvent, PointerEvent } from "react";

/** Whether a press landed outside the dialog's box, on its backdrop. */
function onBackdrop(
  dialog: HTMLDialogElement,
  event: { target: EventTarget; clientX: number; clientY: number },
): boolean {
  if (event.target !== dialog) return false;
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

/**
 * What makes a press on a sheet's backdrop close it. A press on the sheet's
 * own empty space, below content shorter than the window, also lands on the
 * dialog element itself, so where the press was is what tells the two
 * apart: the backdrop is everything outside the dialog's box. Both the
 * press and the release must be there, so a drag that starts in the sheet,
 * selecting text say, and ends outside it leaves the sheet open.
 */
export const backdropClose = {
  onPointerDown(event: PointerEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    dialog.dataset.pressedBackdrop = onBackdrop(dialog, event) ? "1" : "";
  },
  onClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const pressed = dialog.dataset.pressedBackdrop === "1";
    dialog.dataset.pressedBackdrop = "";
    if (pressed && onBackdrop(dialog, event)) dialog.close();
  },
};
