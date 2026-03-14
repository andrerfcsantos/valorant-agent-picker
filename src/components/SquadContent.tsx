"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import {
  loadSquadSlotConfigs,
  saveSquadSlotConfigs,
} from "@/lib/localStorage";
import type { SlotConfig } from "@/lib/localStorage";
import SquadSlot from "./SquadSlot";
import styles from "./SquadContent.module.css";

function pickForSlot(
  roleFilters: Set<string>,
  taken: Set<string>,
): Agent | null {
  const all = getAllAgents();
  let pool = roleFilters.size > 0
    ? all.filter((a) => roleFilters.has(a.role) && !taken.has(a.key))
    : all.filter((a) => !taken.has(a.key));

  if (pool.length === 0) {
    pool = all.filter((a) => !taken.has(a.key));
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function SquadContent() {
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>(
    Array.from({ length: 5 }, () => ({ name: "", roleFilters: new Set<string>() })),
  );
  const [slotAgents, setSlotAgents] = useState<(Agent | null)[]>([
    null, null, null, null, null,
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = loadSquadSlotConfigs();
    setSlotConfigs(saved);
    setHydrated(true);
  }, []);

  const randomizeAll = useCallback(() => {
    setSlotAgents(() => {
      const taken = new Set<string>();
      const result: (Agent | null)[] = [];
      for (let i = 0; i < 5; i++) {
        const agent = pickForSlot(slotConfigs[i].roleFilters, taken);
        result.push(agent);
        if (agent) taken.add(agent.key);
      }
      return result;
    });
  }, [slotConfigs]);

  const randomizeSingle = useCallback(
    (index: number) => {
      setSlotAgents((prev) => {
        const taken = new Set<string>();
        prev.forEach((a, i) => {
          if (a && i !== index) taken.add(a.key);
        });
        const agent = pickForSlot(slotConfigs[index].roleFilters, taken);
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

  if (!hydrated) return null;

  return (
    <div className={`${styles.container} unselectable`}>
      <h1 className={styles.title}>Build Your Squad</h1>

      <div className={styles.buttonRow}>
        <button className={styles.randomizeButton} onClick={randomizeAll}>
          Randomize Squad
        </button>
        <button className={styles.copyButton} onClick={handleCopy}>
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <div className={styles.slotsRow}>
        {slotConfigs.map((config, i) => (
          <SquadSlot
            key={i}
            index={i}
            config={config}
            agent={slotAgents[i]}
            onNameChange={(name) =>
              updateSlotConfig(i, (prev) => ({ ...prev, name }))
            }
            onToggleRole={(role: Role) =>
              updateSlotConfig(i, (prev) => {
                const next = new Set(prev.roleFilters);
                if (next.has(role)) next.delete(role);
                else next.add(role);
                return { ...prev, roleFilters: next };
              })
            }
            onReroll={() => randomizeSingle(i)}
          />
        ))}
      </div>
    </div>
  );
}
