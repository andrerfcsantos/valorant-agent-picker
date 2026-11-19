"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAgentsByRole } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
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
import { track } from "@/lib/analytics";
import {
  loadSquadSlotConfigs,
  saveSquadSlotConfigs,
  loadSquadSize,
  saveSquadSize,
} from "@/lib/localStorage";
import { tryDecodeShare } from "@/lib/share/codec";
import { SquadPreset } from "@/lib/share/types";
import { readShareParam, shareUrl, stripShareParam } from "@/lib/share/urls";
import ShareButton from "./ShareButton";
import SharedPresetNotice from "./SharedPresetNotice";
import SquadSlot from "./SquadSlot";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import styles from "./SquadContent.module.css";

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

export default function SquadContent() {
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>(() =>
    ensureConfigs([]),
  );
  const [slotAgents, setSlotAgents] = useState<(Agent | null)[]>([]);
  const [squadSize, setSquadSize] = useState(MAX_SLOTS);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedPresetApplied, setSharedPresetApplied] = useState(false);
  const setupBeforeShare = useRef<SquadSetup | null>(null);
  const pendingFilterEvents = useRef(new Map<number, PendingFilterEvent>());

  // Leaving the page within the delay still reports the edit.
  useEffect(() => {
    const pending = pendingFilterEvents.current;
    return () => {
      pending.forEach(({ timer, send }) => {
        clearTimeout(timer);
        send();
      });
      pending.clear();
    };
  }, []);

  const applySetup = useCallback((setup: SquadSetup) => {
    setSlotConfigs(setup.configs);
    setSquadSize(setup.size);
    saveSquadSlotConfigs(setup.configs);
    saveSquadSize(setup.size);
    setSlotAgents(computeSquad(setup.configs, setup.size));
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

    setHydrated(true);
  }, [applySetup]);

  const randomizeAll = useCallback(() => {
    setSlotAgents(computeSquad(slotConfigs, squadSize));
    track("squad_randomized", {
      source: "generator",
      squad_size: squadSize,
      filtered_slot_count: slotConfigs
        .slice(0, squadSize)
        .filter((cfg) => cfg.disabledAgents.size > 0).length,
    });
  }, [slotConfigs, squadSize]);

  const handleSizeChange = useCallback(
    (size: number) => {
      setSquadSize(size);
      saveSquadSize(size);
      setSlotAgents(computeSquad(slotConfigs, size));
      track("squad_size_changed", { squad_size: size });
    },
    [slotConfigs],
  );

  const randomizeSingle = useCallback(
    (index: number) => {
      setSlotAgents((prev) => {
        const taken = new Set<string>();
        prev.forEach((a, i) => {
          if (a && i !== index) taken.add(a.key);
        });
        const cfg = slotConfigs[index] ?? emptySlotConfig();
        const agent = pickForSlot(cfg.disabledAgents, taken);
        const next = [...prev];
        next[index] = agent;
        return next;
      });
      track("squad_slot_rerolled", {
        source: "generator",
        squad_size: squadSize,
        slot_index: index,
      });
    },
    [slotConfigs, squadSize],
  );

  const updateSlotConfig = useCallback(
    (index: number, updater: (prev: SlotConfig) => SlotConfig) => {
      setSlotConfigs((prev) => {
        const next = ensureConfigs([...prev]);
        next[index] = updater(next[index]);
        saveSquadSlotConfigs(next);
        return next;
      });
    },
    [],
  );

  /** Replaces a slot's excluded agents, and reports the edit once it settles. */
  const setSlotFilters = useCallback(
    (index: number, disabledAgents: Set<string>) => {
      updateSlotConfig(index, (prev) => ({ ...prev, disabledAgents }));
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
    [updateSlotConfig],
  );

  const handleCopy = useCallback(() => {
    const parts = slotAgents
      .slice(0, squadSize)
      .map((agent, i) => {
        if (!agent) return null;
        const name = slotConfigs[i]?.name.trim() ?? "";
        return name ? `${name} - ${agent.name}` : agent.name;
      })
      .filter(Boolean);

    if (parts.length === 0) return;

    navigator.clipboard.writeText(parts.join(" | ")).then(
      () => track("squad_copied_as_text", { squad_size: squadSize }),
      () => {},
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slotAgents, slotConfigs, squadSize]);

  const currentPreset = useCallback(
    (): SquadPreset => ({
      size: squadSize,
      slots: enabledFromSlotConfigs(slotConfigs),
      names: ensureConfigs(slotConfigs).map((cfg) => cfg.name),
    }),
    [squadSize, slotConfigs],
  );

  const buildResultUrl = useCallback(
    () =>
      shareUrl({
        kind: "squad-result",
        squad: currentPreset(),
        result: {
          agents: Array.from(
            { length: squadSize },
            (_, i) => slotAgents[i]?.key ?? null,
          ),
        },
      }),
    [currentPreset, slotAgents, squadSize],
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

  if (!hydrated) return null;

  return (
    <div className={styles.container}>
      {sharedPresetApplied && (
        <SharedPresetNotice
          message="A shared squad setup has been applied, replacing your own filters."
          onUndo={handleUndoShared}
          onDismiss={handleDismissShared}
        />
      )}

      <h1 className={styles.title}>Build Your Squad</h1>

      <p className={styles.pageDescription}>
        Choose your squad size and hit <strong>Randomize Squad</strong> to get a
        random squad.
        <br />
        You can select the pool of random agents for each slot and give it a
        name.
        <br />
        <strong>Share squad</strong> sends a link that reveals this squad — the
        agents stay hidden until it is opened.
      </p>

      <div className={styles.sizeSelector}>
        {Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`${styles.sizeButton} ${squadSize === n ? styles.sizeButtonActive : ""}`}
            onClick={() => handleSizeChange(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className={styles.randomizeWrapper}>
        <button className={styles.randomizeButton} onClick={randomizeAll}>
          Randomize Squad
        </button>
      </div>

      <div className={styles.buttonRow}>
        <div className={styles.buttonGrid}>
          <ShareButton
            className={styles.copyButton}
            buildUrl={buildResultUrl}
            shareType="squad_result"
            shareSource="squad"
            label="Share squad"
            copiedLabel="Squad link copied!"
            title="Copy a link that reveals this squad"
          />
          <ShareButton
            className={styles.copyButton}
            buildUrl={buildPresetUrl}
            shareType="squad_preset"
            shareSource="squad"
            label="Share setup"
            copiedLabel="Setup link copied!"
            title="Copy a link that sets up these slot filters"
          />
          <button className={styles.copyButton} onClick={handleCopy}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "0.4rem", flexShrink: 0 }}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? "Copied!" : "Copy as text"}
          </button>
        </div>
      </div>

      <div className={styles.slotsRow}>
        {slotConfigs.slice(0, squadSize).map((config, i) => (
          <SquadSlot
            key={i}
            index={i}
            config={config}
            agent={slotAgents[i] ?? null}
            onNameChange={(name) =>
              updateSlotConfig(i, (prev) => ({ ...prev, name }))
            }
            onToggleAgent={(agentKey: string) => {
              const next = new Set(config.disabledAgents);
              if (next.has(agentKey)) next.delete(agentKey);
              else next.add(agentKey);
              setSlotFilters(i, next);
            }}
            onToggleRoleAll={(role: Role) => {
              const roleAgents = getAgentsByRole(role);
              const allEnabled = roleAgents.every(
                (a) => !config.disabledAgents.has(a.key),
              );
              const next = new Set(config.disabledAgents);
              if (allEnabled) {
                roleAgents.forEach((a) => next.add(a.key));
              } else {
                roleAgents.forEach((a) => next.delete(a.key));
              }
              setSlotFilters(i, next);
            }}
            onReroll={() => randomizeSingle(i)}
          />
        ))}
      </div>
    </div>
  );
}
