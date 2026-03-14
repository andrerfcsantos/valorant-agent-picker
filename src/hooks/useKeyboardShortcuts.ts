"use client";

import { useEffect, useRef } from "react";

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      const key = e.key.toLowerCase();

      if (e.ctrlKey && !e.metaKey && !e.altKey) {
        const handler = shortcutsRef.current[`ctrl+${key}`];
        if (handler) {
          e.preventDefault();
          handler();
          return;
        }
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const handler = shortcutsRef.current[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
