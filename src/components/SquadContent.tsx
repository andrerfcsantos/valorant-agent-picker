"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllAgents, getAgentsByRole } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import {
  loadSquadSlotConfigs,
  saveSquadSlotConfigs,
  loadSquadSize,
  saveSquadSize,
} from "@/lib/localStorage";
import type { SlotConfig } from "@/lib/localStorage";
import SquadSlot from "./SquadSlot";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import styles from "./SquadContent.module.css";

function pickForSlot(
  disabledAgents: Set<string>,
  taken: Set<string>,
): Agent | null {
  const all = getAllAgents();
  let pool = all.filter((a) => !disabledAgents.has(a.key) && !taken.has(a.key));
  if (pool.length === 0) pool = all.filter((a) => !taken.has(a.key));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function computeRandomAgents(configs: SlotConfig[], size: number): (Agent | null)[] {
  const taken = new Set<string>();
  const result: (Agent | null)[] = [];
  for (let i = 0; i < size; i++) {
    const agent = pickForSlot(configs[i].disabledAgents, taken);
    result.push(agent);
    if (agent) taken.add(agent.key);
  }
  for (let i = size; i < 5; i++) result.push(null);
  return result;
}

export default function SquadContent() {
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>(
    Array.from({ length: 5 }, () => ({ name: "", disabledAgents: new Set<string>() })),
  );
  const [slotAgents, setSlotAgents] = useState<(Agent | null)[]>([
    null, null, null, null, null,
  ]);
  const [squadSize, setSquadSize] = useState(5);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = loadSquadSlotConfigs();
    const size = loadSquadSize();
    setSlotConfigs(saved);
    setSquadSize(size);
    setSlotAgents(computeRandomAgents(saved, size));
    setHydrated(true);
  }, []);

  const randomizeAll = useCallback(() => {
    setSlotAgents(() => {
      const taken = new Set<string>();
      const result: (Agent | null)[] = [];
      for (let i = 0; i < squadSize; i++) {
        const agent = pickForSlot(slotConfigs[i].disabledAgents, taken);
        result.push(agent);
        if (agent) taken.add(agent.key);
      }
      for (let i = squadSize; i < 5; i++) result.push(null);
      return result;
    });
  }, [slotConfigs, squadSize]);

  const handleSizeChange = useCallback((size: number) => {
    setSquadSize(size);
    saveSquadSize(size);
    setSlotAgents(computeRandomAgents(slotConfigs, size));
  }, [slotConfigs]);

  const randomizeSingle = useCallback(
    (index: number) => {
      setSlotAgents((prev) => {
        const taken = new Set<string>();
        prev.forEach((a, i) => {
          if (a && i !== index) taken.add(a.key);
        });
        const agent = pickForSlot(slotConfigs[index].disabledAgents, taken);
        const next = [...prev];
        next[index] = agent;
        return next;
      });
    },
    [slotConfigs],
  );

  const updateSlotConfig = useCallback(
    (index: number, updater: (prev: SlotConfig) => SlotConfig) => {
      setSlotConfigs((prev) => {
        const next = [...prev];
        next[index] = updater(prev[index]);
        saveSquadSlotConfigs(next);
        return next;
      });
    },
    [],
  );

  const handleCopy = useCallback(() => {
    const parts = slotAgents
      .map((agent, i) => {
        if (!agent) return null;
        const name = slotConfigs[i].name.trim();
        return name ? `${name} - ${agent.name}` : agent.name;
      })
      .filter(Boolean);

    if (parts.length === 0) return;

    navigator.clipboard.writeText(parts.join(" | "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slotAgents, slotConfigs]);

  useKeyboardShortcuts({ r: randomizeAll, "ctrl+c": handleCopy });

  if (!hydrated) return null;

  return (
    <div className={`${styles.container} unselectable`}>
      <h1 className={styles.title}>Build Your Squad</h1>

      <div className={styles.sizeSelector}>
        {[1, 2, 3, 4, 5].map((n) => (
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
        <button className={styles.copyButton} onClick={handleCopy}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.4rem", flexShrink: 0 }}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <div className={styles.slotsRow}>
        {slotConfigs.slice(0, squadSize).map((config, i) => (
          <SquadSlot
            key={i}
            index={i}
            config={config}
            agent={slotAgents[i]}
            onNameChange={(name) =>
              updateSlotConfig(i, (prev) => ({ ...prev, name }))
            }
            onToggleAgent={(agentKey: string) =>
              updateSlotConfig(i, (prev) => {
                const next = new Set(prev.disabledAgents);
                if (next.has(agentKey)) next.delete(agentKey);
                else next.add(agentKey);
                return { ...prev, disabledAgents: next };
              })
            }
            onToggleRoleAll={(role: Role) =>
              updateSlotConfig(i, (prev) => {
                const roleAgents = getAgentsByRole(role);
                const allEnabled = roleAgents.every((a) => !prev.disabledAgents.has(a.key));
                const next = new Set(prev.disabledAgents);
                if (allEnabled) {
                  roleAgents.forEach((a) => next.add(a.key));
                } else {
                  roleAgents.forEach((a) => next.delete(a.key));
                }
                return { ...prev, disabledAgents: next };
              })
            }
            onReroll={() => randomizeSingle(i)}
          />
        ))}
      </div>
    </div>
  );
}
