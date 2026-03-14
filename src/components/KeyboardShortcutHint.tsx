"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const soloShortcuts = [
  { key: "R", description: "Randomize agent" },
  { key: "S", description: "Toggle all Sentinels" },
  { key: "I", description: "Toggle all Initiators" },
  { key: "D", description: "Toggle all Duelists" },
  { key: "C", description: "Toggle all Controllers" },
  { key: "U", description: "Unselect all agents" },
];

const squadShortcuts = [
  { key: "R", description: "Randomize squad" },
];

export default function KeyboardShortcutHint() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const shortcuts = pathname === "/squad" ? squadShortcuts : soloShortcuts;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={popoverRef} className="shortcut-hint-container">
      {open && (
        <div className="shortcut-popover">
          <h3 className="shortcut-popover-title">Keyboard Shortcuts</h3>
          <div className="shortcut-list">
            {shortcuts.map(({ key, description }) => (
              <div key={key} className="shortcut-row">
                <kbd className="shortcut-kbd">{key}</kbd>
                <span className="shortcut-desc">{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        className="shortcut-hint-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        ?
      </button>
    </div>
  );
}
