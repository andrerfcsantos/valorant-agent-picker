"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AGENTS, getAgentsByRole, getAllAgents } from "@/data/agents";
import type { Role } from "@/data/agents";
import { track } from "@/lib/analytics";
import { loadSelectedAgents, saveSelectedAgents } from "@/lib/localStorage";
import { tryDecodeShare } from "@/lib/share/codec";
import { PickerPreset } from "@/lib/share/types";
import { readShareParam, stripShareParam } from "@/lib/share/urls";

interface AgentContextValue {
  /** Exact selection state. Empty means "nothing selected", which the picker treats as "all agents". */
  selectedAgents: Set<string>;
  /** False until localStorage has been read, so nothing renders from defaults. */
  isHydrated: boolean;
  toggleAgent: (key: string) => void;
  selectByRole: (role: Role) => void;
  unselectByRole: (role: Role) => void;
  selectOnlyRole: (role: Role) => void;
  selectAll: () => void;
  unselectAll: () => void;
  /** Replaces the whole selection at once, as applying a preset does. */
  setSelected: (keys: string[]) => void;
  /** Options that came with a shared preset on this page load, if any. */
  sharedPreset: PickerPreset | null;
  /** True while the shared-preset notice should be shown. */
  sharedPresetApplied: boolean;
  /** Puts back the filters the shared preset replaced. */
  undoSharedPreset: () => void;
  /** Hides the shared-preset notice without changing the filters. */
  dismissSharedPreset: () => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(
    () => new Set(),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [sharedPreset, setSharedPreset] = useState<PickerPreset | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const replacedSelection = useRef<Set<string> | null>(null);

  // Restore from localStorage on mount, unless the URL carries a shared preset.
  // This is the only place the URL is read, so no other component can race it.
  useEffect(() => {
    const saved =
      loadSelectedAgents() ?? new Set(getAllAgents().map((a) => a.key));
    const raw = readShareParam(window.location.search);
    const shared = tryDecodeShare(raw);

    if (shared.ok && shared.payload.kind === "picker-preset") {
      replacedSelection.current = saved;
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- localStorage and the URL are only read after mount
      setSelectedAgents(new Set(shared.payload.picker.selected));
      setSharedPreset(shared.payload.picker);
      setNoticeOpen(true);
      stripShareParam();
      track("shared_link_opened", { share_type: "picker_preset", valid: true });
    } else {
      if (raw && !shared.ok && window.location.pathname === "/") {
        // Broken links elsewhere are reported by the page that renders the
        // error; this provider mounts everywhere, so it only speaks for "/".
        track("shared_link_opened", {
          share_type: "unknown",
          valid: false,
          invalid_reason: shared.reason,
        });
      }
      setSelectedAgents(saved);
    }

    setIsHydrated(true);
  }, []);

  // Persist on every change, once there is something worth persisting. Writing
  // before hydration would overwrite the saved selection with the empty one the
  // first render starts from.
  useEffect(() => {
    if (!isHydrated) return;
    saveSelectedAgents(selectedAgents);
  }, [selectedAgents, isHydrated]);

  const undoSharedPreset = useCallback(() => {
    if (replacedSelection.current) {
      setSelectedAgents(replacedSelection.current);
    }
    setNoticeOpen(false);
  }, []);

  const dismissSharedPreset = useCallback(() => setNoticeOpen(false), []);

  const toggleAgent = useCallback((key: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectByRole = useCallback((role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.add(a.key));
      return next;
    });
  }, []);

  const unselectByRole = useCallback((role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.delete(a.key));
      return next;
    });
  }, []);

  const selectOnlyRole = useCallback((role: Role) => {
    setSelectedAgents(new Set(getAgentsByRole(role).map((a) => a.key)));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedAgents(new Set(Object.keys(AGENTS)));
  }, []);

  const unselectAll = useCallback(() => {
    setSelectedAgents(new Set());
  }, []);

  const setSelected = useCallback(
    (keys: string[]) => setSelectedAgents(new Set(keys)),
    [],
  );

  const value = useMemo(
    () => ({
      selectedAgents,
      isHydrated,
      toggleAgent,
      selectByRole,
      unselectByRole,
      selectOnlyRole,
      selectAll,
      unselectAll,
      setSelected,
      sharedPreset,
      sharedPresetApplied: noticeOpen,
      undoSharedPreset,
      dismissSharedPreset,
    }),
    [
      selectedAgents,
      isHydrated,
      toggleAgent,
      selectByRole,
      unselectByRole,
      selectOnlyRole,
      selectAll,
      unselectAll,
      setSelected,
      sharedPreset,
      noticeOpen,
      undoSharedPreset,
      dismissSharedPreset,
    ],
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgents must be used within AgentProvider");
  return context;
}
