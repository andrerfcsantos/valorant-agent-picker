"use client";

import { useEffect, useRef, useState } from "react";

interface PresetNameFieldProps {
  initialValue: string;
  label: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

/**
 * Naming a preset happens in place, so neither the picker nor the manage page
 * ever has to open a dialog for it. Enter and Escape work, and both are also
 * offered as buttons for anyone who would rather click.
 */
export default function PresetNameField({
  initialValue,
  label,
  onCommit,
  onCancel,
}: PresetNameFieldProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // The field only ever appears in answer to a click, so taking focus is the
  // point of it rather than a surprise.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => (value.trim() ? onCommit(value) : onCancel());

  return (
    <span className="preset-name-edit" ref={wrapRef}>
      <input
        ref={inputRef}
        className="preset-name-field"
        value={value}
        aria-label={label}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={(e) => {
          // Tabbing to the buttons is not leaving the field, so it stays open
          // and lets them do their job.
          if (wrapRef.current?.contains(e.relatedTarget)) return;
          commit();
        }}
      />
      <button
        className="preset-name-action confirm"
        // Keeps focus in the input, so the click lands instead of a blur
        // committing first and taking the button away with it.
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        aria-label="Save name"
        title="Save (Enter)"
      >
        ✓
      </button>
      <button
        className="preset-name-action cancel"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        aria-label="Cancel renaming"
        title="Cancel (Esc)"
      >
        ✕
      </button>
    </span>
  );
}
