"use client";

import { useEffect, useId, useRef } from "react";
import PresetManager, { PresetIntro } from "./PresetManager";
import sheet from "./Sheet.module.css";
import { backdropClose } from "./sheet";
import ui from "./ui.module.css";

interface PresetSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The preset manager in a sheet over the picker. Managing presets is a detour
 * from rolling, so it happens on top of the roll rather than on another page:
 * the agent on screen is still there afterwards, and a preset applied here is
 * the pool the visitor lands back on.
 */
export default function PresetSheet({ open, onClose }: PresetSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- a click on the backdrop closes the sheet; the keyboard has Escape and the Close button
    <dialog
      ref={dialogRef}
      className={`${ui.page} ${sheet.sheet} ${sheet.wide}`}
      aria-labelledby={titleId}
      // The picker's shortcuts change the pool and apply presets, which is
      // not what a key pressed in here is for.
      data-shortcuts="off"
      onClose={onClose}
      {...backdropClose}
    >
      {open && (
        <div className={sheet.body}>
          <header className={sheet.head}>
            <h2 id={titleId} className={sheet.title}>
              Manage presets
            </h2>
            <button
              type="button"
              className={ui.btn}
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </header>
          <PresetIntro className={sheet.intro} />
          <div className={sheet.content}>
            <PresetManager onApplied={() => dialogRef.current?.close()} />
          </div>
        </div>
      )}
    </dialog>
  );
}
