"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAgents } from "@/context/AgentContext";
import {
  type PresetApplySource,
  builtinId,
  presetKind,
  track,
} from "@/lib/analytics";
import { buildDefaultPresets } from "@/lib/presets/defaults";
import { loadPresets, savePresets } from "@/lib/presets/storage";
import { SavedPreset } from "@/lib/presets/types";

interface PresetContextValue {
  presets: SavedPreset[];
  /** The preset the current filters came from, if any. */
  appliedId: string | null;
  /** True once the filters have drifted away from the applied preset. */
  isDirty: boolean;
  /** False until localStorage has been read, so nothing renders from defaults. */
  isHydrated: boolean;
  /** `source` says which control applied it, for analytics. */
  applyPreset: (id: string, source?: PresetApplySource) => void;
  /** Saves the current filters as a new preset and applies it. */
  savePreset: (name: string) => void;
  /** Points an existing preset at the current filters. */
  updatePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  duplicatePreset: (id: string) => void;
  deletePreset: (id: string) => void;
  /** Moves a preset by `offset` places, which is how the order is edited. */
  movePreset: (id: string, offset: number) => void;
  /** Puts the filters back to the applied preset. */
  revert: () => void;
  /**
   * Stops tracking the applied preset without touching the agents, which is how
   * someone goes back to a plain hand-picked selection.
   */
  clearApplied: () => void;
  /** Appends any built-in preset that is no longer in the list. */
  restoreDefaults: () => void;
}

const PresetContext = createContext<PresetContextValue | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameAgents(a: string[], b: Set<string>): boolean {
  if (a.length !== b.size) return false;
  return a.every((key) => b.has(key));
}

export function PresetProvider({ children }: { children: React.ReactNode }) {
  const { selectedAgents, setSelected } = useAgents();
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const selectedKeys = useMemo(
    () => Array.from(selectedAgents),
    [selectedAgents],
  );

  useEffect(() => {
    const stored = loadPresets();
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- saved presets are in localStorage, read after mount
    setPresets(stored.presets);
    setAppliedId(stored.appliedId);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    savePresets({ presets, appliedId });
  }, [presets, appliedId, isHydrated]);

  const applied = useMemo(
    () => presets.find((preset) => preset.id === appliedId) ?? null,
    [presets, appliedId],
  );

  const isDirty = applied ? !sameAgents(applied.agents, selectedAgents) : false;

  const applyPreset = useCallback(
    (id: string, source: PresetApplySource = "chip") => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      setSelected(preset.agents);
      setAppliedId(id);
      track("preset_applied", {
        preset_kind: presetKind(id),
        builtin_id: builtinId(id),
        agent_count: preset.agents.length,
        source,
      });
    },
    [presets, setSelected],
  );

  const savePreset = useCallback(
    (name: string) => {
      const preset: SavedPreset = {
        id: newId(),
        name: name.trim() || "Untitled preset",
        agents: selectedKeys,
      };
      setPresets((current) => [...current, preset]);
      setAppliedId(preset.id);
      track("preset_created", {
        agent_count: selectedKeys.length,
        source: "selection",
      });
    },
    [selectedKeys],
  );

  const updatePreset = useCallback(
    (id: string) => {
      setPresets((current) =>
        current.map((preset) =>
          preset.id === id ? { ...preset, agents: selectedKeys } : preset,
        ),
      );
      setAppliedId(id);
      track("preset_updated", {
        preset_kind: presetKind(id),
        agent_count: selectedKeys.length,
      });
    },
    [selectedKeys],
  );

  const renamePreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPresets((current) =>
      current.map((preset) =>
        preset.id === id ? { ...preset, name: trimmed } : preset,
      ),
    );
    track("preset_managed", { action: "renamed" });
  }, []);

  const duplicatePreset = useCallback((id: string) => {
    track("preset_managed", { action: "duplicated" });
    setPresets((current) => {
      const index = current.findIndex((preset) => preset.id === id);
      if (index < 0) return current;
      const copy: SavedPreset = {
        id: newId(),
        name: `${current[index].name} copy`,
        agents: [...current[index].agents],
      };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }, []);

  const deletePreset = useCallback(
    (id: string) => {
      setPresets((current) => current.filter((preset) => preset.id !== id));
      if (id === appliedId) setAppliedId(null);
      track("preset_deleted", { preset_kind: presetKind(id) });
    },
    [appliedId],
  );

  const movePreset = useCallback((id: string, offset: number) => {
    track("preset_managed", { action: "moved" });
    setPresets((current) => {
      const index = current.findIndex((preset) => preset.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const revert = useCallback(() => {
    if (!applied) return;
    setSelected(applied.agents);
    track("preset_managed", { action: "reverted" });
  }, [applied, setSelected]);

  const clearApplied = useCallback(() => {
    setAppliedId(null);
    track("preset_managed", { action: "unselected" });
  }, []);

  const restoreDefaults = useCallback(() => {
    track("preset_managed", { action: "restored_defaults" });
    setPresets((current) => {
      const present = new Set(current.map((preset) => preset.id));
      const missing = buildDefaultPresets().filter(
        (preset) => !present.has(preset.id),
      );
      return missing.length ? [...current, ...missing] : current;
    });
  }, []);

  const value = useMemo(
    () => ({
      presets,
      appliedId,
      isDirty,
      isHydrated,
      applyPreset,
      savePreset,
      updatePreset,
      renamePreset,
      duplicatePreset,
      deletePreset,
      movePreset,
      revert,
      clearApplied,
      restoreDefaults,
    }),
    [
      presets,
      appliedId,
      isDirty,
      isHydrated,
      applyPreset,
      savePreset,
      updatePreset,
      renamePreset,
      duplicatePreset,
      deletePreset,
      movePreset,
      revert,
      clearApplied,
      restoreDefaults,
    ],
  );

  return (
    <PresetContext.Provider value={value}>{children}</PresetContext.Provider>
  );
}

export function usePresets() {
  const context = useContext(PresetContext);
  if (!context) {
    throw new Error("usePresets must be used within PresetProvider");
  }
  return context;
}
