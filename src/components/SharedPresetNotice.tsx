"use client";

import { focusPageHeading } from "@/lib/pageHeading";

interface SharedPresetNoticeProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * Opening a shared link overwrites filters the visitor may have spent a long
 * time curating, so the swap is always announced and always reversible.
 */
export default function SharedPresetNotice({
  message,
  onUndo,
  onDismiss,
}: SharedPresetNoticeProps) {
  // Either button closes the notice, and itself with it: keep keyboard focus
  // on the page rather than letting it fall to <body>.
  const closing =
    (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
      if (document.activeElement === event.currentTarget) focusPageHeading();
      action();
    };

  return (
    <div className="shared-preset-notice" aria-live="polite">
      <span className="shared-preset-notice-text">{message}</span>
      <button className="shared-preset-notice-undo" onClick={closing(onUndo)}>
        Undo
      </button>
      <button
        className="shared-preset-notice-dismiss"
        onClick={closing(onDismiss)}
        aria-label="Dismiss"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
