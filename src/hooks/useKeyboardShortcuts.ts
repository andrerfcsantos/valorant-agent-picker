"use client";

import { useEffect, useEffectEvent } from "react";
import { track } from "@/lib/analytics";

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  // An effect event always sees the latest `shortcuts`, so the listener can be
  // attached once without going stale as the handlers change between renders.
  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    // A surface that covers the page can ask for the page's shortcuts to stay
    // out of it, so a key pressed there does not act on what is behind.
    if ((e.target as HTMLElement).closest?.('[data-shortcuts="off"]')) return;

    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.target as HTMLElement).isContentEditable) return;

    const key = e.key.toLowerCase();

    if (e.ctrlKey && !e.metaKey && !e.altKey) {
      const combo = `ctrl+${key}`;
      const handler = shortcuts[combo];
      if (handler) {
        e.preventDefault();
        handler();
        track("keyboard_shortcut_used", { key: combo });
        return;
      }
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const handler = shortcuts[key];
    if (handler) {
      e.preventDefault();
      handler();
      track("keyboard_shortcut_used", { key });
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}
