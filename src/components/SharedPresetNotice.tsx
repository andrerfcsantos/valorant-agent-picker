"use client";

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
  return (
    <div className="shared-preset-notice" aria-live="polite">
      <span className="shared-preset-notice-text">{message}</span>
      <button className="shared-preset-notice-undo" onClick={onUndo}>
        Undo
      </button>
      <button
        className="shared-preset-notice-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
