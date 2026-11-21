"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent } from "@/data/agents";
import { beforeDesignChange, track } from "@/lib/analytics";
import {
  MAX_SLOTS,
  computeSquad,
  emptySlotConfig,
  enabledFromSlotConfigs,
  ensureConfigs,
  pickForSlot,
  slotConfigsFromEnabled,
} from "@/lib/squadService";
import type { SlotConfig } from "@/lib/squadService";
import { tryDecodeShare } from "@/lib/share/codec";
import { SquadPreset } from "@/lib/share/types";
import { readShareParam, shareUrl, stripShareParam } from "@/lib/share/urls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  loadSquadSlotConfigs,
  saveSquadSlotConfigs,
  loadSquadSize,
  saveSquadSize,
} from "@/lib/localStorage";

interface SquadSetup {
  size: number;
  configs: SlotConfig[];
}

/**
 * How long a slot's filters must sit still before the edit is reported. Each
 * agent is its own checkbox, so one event per click would mostly count clicks.
 */
const FILTER_EVENT_DELAY_MS = 2000;

interface PendingFilterEvent {
  timer: ReturnType<typeof setTimeout>;
  send: () => void;
}

/**
 * Everything the squad generator does, without any of how it looks: the roll,
 * per-slot filters and names, share links, copy as text, and the keyboard
 * shortcuts. The classic and the new design are two views over this one
 * hook, so a behaviour change lands in both.
 *
 * Call it once per page, above the choice of design (see `SquadPage`), and
 * hand the result to whichever view is showing. A second instance would roll
 * a new squad and lose a shared setup's undo, which is what switching design
 * must not do.
 */
export function useSquad() {
  const [mounted, setMounted] = useState(false);
  const [squadSize, setSquadSize] = useState(MAX_SLOTS);
  const [configs, setConfigs] = useState<SlotConfig[]>(() => ensureConfigs([]));
  const [agents, setAgents] = useState<(Agent | null)[]>([]);
  const [copied, setCopied] = useState(false);
  const [rollCount, setRollCount] = useState(0);
  const [squadRollCount, setSquadRollCount] = useState(0);
  const [sharedPresetApplied, setSharedPresetApplied] = useState(false);
  const setupBeforeShare = useRef<SquadSetup | null>(null);
  const pendingFilterEvents = useRef(new Map<number, PendingFilterEvent>());
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leaving the page or switching design within the delay still reports the
  // edit, under the design it was made in.
  useEffect(() => {
    const pending = pendingFilterEvents.current;
    const flush = () => {
      pending.forEach(({ timer, send }) => {
        clearTimeout(timer);
        send();
      });
      pending.clear();
    };
    const unsubscribe = beforeDesignChange(flush);
    return () => {
      unsubscribe();
      flush();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const applySetup = useCallback((setup: SquadSetup) => {
    setConfigs(setup.configs);
    setSquadSize(setup.size);
    saveSquadSlotConfigs(setup.configs);
    saveSquadSize(setup.size);
    setAgents(computeSquad(setup.configs, setup.size));
  }, []);

  // Load state from localStorage on mount, unless the URL carries a shared setup
  useEffect(() => {
    const saved: SquadSetup = {
      size: loadSquadSize(),
      configs: ensureConfigs(loadSquadSlotConfigs()),
    };

    const raw = readShareParam(window.location.search);
    const shared = tryDecodeShare(raw);
    if (shared.ok && shared.payload.kind === "squad-preset") {
      const preset = shared.payload.squad;
      setupBeforeShare.current = saved;
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- localStorage and the URL are only read after mount
      applySetup({
        size: preset.size,
        configs: slotConfigsFromEnabled(preset.slots, preset.names),
      });
      setSharedPresetApplied(true);
      stripShareParam();
      track("shared_link_opened", { share_type: "squad_preset", valid: true });
    } else {
      if (raw && !shared.ok) {
        track("shared_link_opened", {
          share_type: "unknown",
          valid: false,
          invalid_reason: shared.reason,
        });
      }
      applySetup(saved);
    }

    setMounted(true);
  }, [applySetup]);

  // Persist configs when they change
  useEffect(() => {
    if (mounted) saveSquadSlotConfigs(configs);
  }, [configs, mounted]);

  const randomizeAll = useCallback(() => {
    setAgents(computeSquad(configs, squadSize));
    setRollCount((count) => count + 1);
    setSquadRollCount((count) => count + 1);
    track("squad_randomized", {
      source: "generator",
      squad_size: squadSize,
      filtered_slot_count: configs
        .slice(0, squadSize)
        .filter((cfg) => cfg.disabledAgents.size > 0).length,
    });
  }, [configs, squadSize]);

  const randomizeSingle = useCallback(
    (index: number) => {
      const taken = new Set<string>();
      agents.forEach((agent, i) => {
        if (agent && i !== index) taken.add(agent.key);
      });
      const cfg = configs[index] ?? emptySlotConfig();
      const next = [...agents];
      next[index] = pickForSlot(cfg.disabledAgents, taken);
      setAgents(next);
      setRollCount((count) => count + 1);
      track("squad_slot_rerolled", {
        source: "generator",
        squad_size: squadSize,
        slot_index: index,
      });
    },
    [agents, configs, squadSize],
  );

  const handleCopy = useCallback(() => {
    const parts = agents
      .slice(0, squadSize)
      .map((agent, i) => {
        if (!agent) return null;
        const name = configs[i]?.name.trim() ?? "";
        return name ? `${name} - ${agent.name}` : agent.name;
      })
      .filter(Boolean);

    if (parts.length === 0) return;

    // Only a copy that landed says so. The clipboard needs a secure context
    // and permission, and without the API at all `writeText` is not there.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(parts.join(" | ")))
      .then(
        () => {
          track("squad_copied_as_text", { squad_size: squadSize });
          setCopied(true);
          if (copiedTimer.current) clearTimeout(copiedTimer.current);
          copiedTimer.current = setTimeout(() => setCopied(false), 2000);
        },
        () => {},
      );
  }, [agents, configs, squadSize]);

  const handleSizeChange = useCallback(
    (size: number) => {
      setSquadSize(size);
      saveSquadSize(size);
      setAgents(computeSquad(configs, size));
      track("squad_size_changed", { squad_size: size });
    },
    [configs],
  );

  const handleNameChange = useCallback((index: number, name: string) => {
    setConfigs((prev) => {
      const next = ensureConfigs([...prev]);
      next[index] = { ...next[index], name };
      return next;
    });
  }, []);

  /** Replaces a slot's excluded agents, and reports the edit once it settles. */
  const handleDisabledChange = useCallback(
    (index: number, disabledAgents: Set<string>) => {
      setConfigs((prev) => {
        const next = ensureConfigs([...prev]);
        next[index] = { ...next[index], disabledAgents };
        return next;
      });
      const pending = pendingFilterEvents.current;
      const previous = pending.get(index);
      if (previous) clearTimeout(previous.timer);
      const send = () => {
        pending.delete(index);
        track("squad_slot_filters_changed", {
          action: "edit",
          slot_index: index,
          disabled_count: disabledAgents.size,
        });
      };
      pending.set(index, {
        timer: setTimeout(send, FILTER_EVENT_DELAY_MS),
        send,
      });
    },
    [],
  );

  /** Gives a player every agent again. */
  const resetSlotFilters = useCallback((index: number) => {
    // A reset replaces whatever edit was waiting to be reported.
    const pending = pendingFilterEvents.current;
    const previous = pending.get(index);
    if (previous) {
      clearTimeout(previous.timer);
      pending.delete(index);
    }
    setConfigs((prev) => {
      const next = ensureConfigs([...prev]);
      next[index] = { ...next[index], disabledAgents: new Set<string>() };
      return next;
    });
    track("squad_slot_filters_changed", {
      action: "reset",
      slot_index: index,
      disabled_count: 0,
    });
  }, []);

  /**
   * Gives every player in the squad every agent again. Slots beyond the squad
   * size keep their filters, for when the squad grows back.
   */
  const resetAllFilters = useCallback(() => {
    const pending = pendingFilterEvents.current;
    pending.forEach(({ timer }, index) => {
      if (index >= squadSize) return;
      clearTimeout(timer);
      pending.delete(index);
    });
    setConfigs((prev) =>
      prev.map((cfg, index) =>
        index < squadSize ? { ...cfg, disabledAgents: new Set<string>() } : cfg,
      ),
    );
    track("squad_slot_filters_changed", {
      action: "reset_all",
      slot_index: null,
      disabled_count: 0,
    });
  }, [squadSize]);

  const currentPreset = useCallback(
    (): SquadPreset => ({
      size: squadSize,
      slots: enabledFromSlotConfigs(configs),
      names: ensureConfigs(configs).map((cfg) => cfg.name),
    }),
    [squadSize, configs],
  );

  const buildResultUrl = useCallback(
    () =>
      shareUrl({
        kind: "squad-result",
        squad: currentPreset(),
        result: {
          agents: Array.from(
            { length: squadSize },
            (_, i) => agents[i]?.key ?? null,
          ),
        },
      }),
    [currentPreset, agents, squadSize],
  );

  const buildPresetUrl = useCallback(
    () => shareUrl({ kind: "squad-preset", squad: currentPreset() }),
    [currentPreset],
  );

  const handleUndoShared = useCallback(() => {
    const previous = setupBeforeShare.current;
    if (previous) applySetup(previous);
    setSharedPresetApplied(false);
    track("shared_preset_undone", { share_type: "squad_preset" });
  }, [applySetup]);

  const handleDismissShared = useCallback(() => {
    setSharedPresetApplied(false);
    track("shared_preset_dismissed", { share_type: "squad_preset" });
  }, []);

  useKeyboardShortcuts({ r: randomizeAll, "ctrl+c": handleCopy });

  return {
    /** False until saved setup has been read; render nothing before it. */
    mounted,
    squadSize,
    configs,
    agents,
    /** Rolls the visitor asked for, whole squad or one player. */
    rollCount,
    /** Rolls of the whole squad only. */
    squadRollCount,
    copied,
    sharedPresetApplied,
    randomizeAll,
    randomizeSingle,
    handleCopy,
    handleSizeChange,
    handleNameChange,
    handleDisabledChange,
    resetSlotFilters,
    resetAllFilters,
    buildResultUrl,
    buildPresetUrl,
    handleUndoShared,
    handleDismissShared,
  };
}

export type Squad = ReturnType<typeof useSquad>;
