"use client";

import { getAgentsByRole } from "@/data/agents";
import type { Role } from "@/data/agents";
import type { Squad } from "@/hooks/useSquad";
import { MAX_SLOTS } from "@/lib/squadService";
import ShareButton from "./ShareButton";
import SharedPresetNotice from "./SharedPresetNotice";
import SquadSlot from "./SquadSlot";
import styles from "./SquadContent.module.css";

/** The classic design of the squad generator. Its behaviour is `useSquad`. */
export default function SquadContent({ squad }: { squad: Squad }) {
  const {
    squadSize,
    configs: slotConfigs,
    agents: slotAgents,
    copied,
    sharedPresetApplied,
    randomizeAll,
    randomizeSingle,
    handleCopy,
    handleSizeChange,
    handleNameChange,
    handleDisabledChange: setSlotFilters,
    buildResultUrl,
    buildPresetUrl,
    handleUndoShared,
    handleDismissShared,
  } = squad;

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
            onNameChange={(name) => handleNameChange(i, name)}
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
