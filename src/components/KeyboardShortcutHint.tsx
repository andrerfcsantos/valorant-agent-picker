"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDesign } from "@/context/DesignContext";

const soloShortcuts = [
  { key: "R", description: "Randomize agent" },
  { key: "S", description: "Toggle all Sentinels" },
  { key: "I", description: "Toggle all Initiators" },
  { key: "D", description: "Toggle all Duelists" },
  { key: "C", description: "Toggle all Controllers" },
  { key: "U", description: "Unselect all agents" },
  { key: "1–0", description: "Apply preset 1 to 10" },
];

const squadShortcuts = [
  { key: "R", description: "Randomize squad" },
  { key: "Ctrl+C", description: "Copy squad to clipboard" },
];

// The new design names the same actions the way its buttons do.
const soloShortcutsRefresh = [
  { key: "R", description: "Roll an agent" },
  { key: "C", description: "Add or remove all controllers" },
  { key: "S", description: "Add or remove all sentinels" },
  { key: "I", description: "Add or remove all initiators" },
  { key: "D", description: "Add or remove all duelists" },
  { key: "U", description: "Clear selection" },
  { key: "1–0", description: "Apply preset 1 to 10" },
];

const squadShortcutsRefresh = [
  { key: "R", description: "Roll the squad" },
  { key: "Ctrl+C", description: "Copy the squad as text" },
];

export default function KeyboardShortcutHint() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { design } = useDesign();

  const onSquad = pathname === "/squad";
  const shortcuts =
    design === "refresh"
      ? onSquad
        ? squadShortcutsRefresh
        : soloShortcutsRefresh
      : onSquad
        ? squadShortcuts
        : soloShortcuts;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
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
