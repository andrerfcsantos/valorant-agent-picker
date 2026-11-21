"use client";

import { useEffect, useRef } from "react";
import { getAllAgents } from "@/data/agents";
import { MAX_SLOTS, emptySlotConfig } from "@/lib/squadService";
import type { Squad } from "@/hooks/useSquad";
import ShareButton from "@/components/ShareButton";
import SharedPresetNotice from "@/components/SharedPresetNotice";
import FeedbackBanner from "./FeedbackBanner";
import { handOffFocus } from "./focus";
import { bringResultIntoView } from "./scroll";
import SquadSlotRefresh from "./SquadSlotRefresh";
import ui from "./ui.module.css";
import styles from "./SquadRefresh.module.css";

const SIZES = Array.from({ length: MAX_SLOTS }, (_, i) => i + 1);
const AGENT_KEYS = getAllAgents().map((agent) => agent.key);

/**
 * The new design of the squad generator: the setup and the roll in a rail
 * that stays put, the squad beside it, one row per player. Its behaviour is
 * `useSquad`, shared with the classic design.
 */
export default function SquadRefresh({ squad }: { squad: Squad }) {
  const {
    squadSize,
    configs,
    agents,
    rollCount,
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
  } = squad;
  const rollButton = useRef<HTMLButtonElement>(null);
  // A whole-squad roll from the fixed bar, made while editing a pool further
  // down, changes every row above. A single player's reroll is made from
  // that player's own row, which is already in view.
  const slotList = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (squadRollCount > 0) bringResultIntoView(slotList.current);
  }, [squadRollCount]);

  // Counted against the agents that exist. A saved pool can still name an
  // agent that has since been removed, which leaves nothing to add back.
  const anyPoolNarrowed = configs
    .slice(0, squadSize)
    .some((config) =>
      AGENT_KEYS.some((agentKey) => config.disabledAgents.has(agentKey)),
    );

  const rolled = agents.slice(0, squadSize);
  const announcement = rolled.some(Boolean)
    ? `Squad: ${rolled.map((agent) => agent?.name ?? "nobody").join(", ")}.`
    : "";

  return (
    <main className={`${ui.page} ${styles.app}`}>
      <section className={styles.rail} aria-labelledby="squad-heading">
        {/* Focusable from script only: it takes focus when the design is
            switched from the invitation, whose own button is removed. */}
        <h1 id="squad-heading" className={styles.heading} tabIndex={-1}>
          Squad generator
        </h1>
        <p className={styles.intro}>
          Every player gets a different agent, from the agents selected for them
          while any are left.
        </p>

        <fieldset className={styles.sizes}>
          <legend className={styles.legend}>Players</legend>
          <div className={styles.sizeRow}>
            {SIZES.map((size) => (
              <label key={size} className={styles.size}>
                <input
                  type="radio"
                  name="squad-size"
                  className={ui.vh}
                  checked={size === squadSize}
                  onChange={() => handleSizeChange(size)}
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={ui.rollBar} data-roll-bar>
          <button
            ref={rollButton}
            type="button"
            className={ui.roll}
            onClick={randomizeAll}
          >
            Roll the squad
            <kbd className={ui.kbd} aria-hidden="true">
              R
            </kbd>
          </button>
        </div>

        {anyPoolNarrowed && (
          <button
            type="button"
            className={`${ui.link} ${styles.resetAll}`}
            // The link goes away with the filters it cleared.
            ref={handOffFocus(() => rollButton.current)}
            onClick={resetAllFilters}
          >
            Select every agent for every player
          </button>
        )}

        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces each roll, not the result of a form */}
        <p className={ui.vh} role="status">
          {/* Keyed by roll, so rolling the same squad again is still read. */}
          <span key={rollCount}>{announcement}</span>
        </p>
      </section>

      <section className={styles.main} aria-labelledby="squad-result-heading">
        <FeedbackBanner />
        {sharedPresetApplied && (
          <div className={styles.notice}>
            <SharedPresetNotice
              message="A shared link set up this squad, replacing your own players and selections."
              onUndo={handleUndoShared}
              onDismiss={handleDismissShared}
            />
          </div>
        )}

        <div className={styles.head}>
          <h2 id="squad-result-heading" className={styles.title}>
            Your squad
          </h2>
          <ShareButton
            className={ui.btn}
            buildUrl={buildResultUrl}
            shareType="squad_result"
            shareSource="squad"
            label="Share this squad"
            copiedLabel="Squad link copied"
            title="Copy a link that reveals this squad. The agents stay hidden until it is opened."
          />
          <ShareButton
            className={ui.btn}
            buildUrl={buildPresetUrl}
            shareType="squad_preset"
            shareSource="squad"
            label="Share this setup"
            copiedLabel="Setup link copied"
            title="Copy a link that sets up these players and selections"
          />
          <button
            type="button"
            className={ui.btn}
            onClick={handleCopy}
            title="Copy the squad as one line of text (Ctrl+C)"
          >
            {copied ? "Squad copied" : "Copy as text"}
          </button>
        </div>

        <ol ref={slotList} className={styles.slots}>
          {Array.from({ length: squadSize }, (_, index) => {
            const config = configs[index] || emptySlotConfig();
            const takenByOthers = new Set(
              rolled.flatMap((other, i) =>
                other && i !== index ? [other.key] : [],
              ),
            );
            return (
              <SquadSlotRefresh
                key={index}
                index={index}
                agent={agents[index] || null}
                name={config.name}
                disabledAgents={config.disabledAgents}
                takenByOthers={takenByOthers}
                onNameChange={handleNameChange}
                onDisabledChange={handleDisabledChange}
                onResetFilters={resetSlotFilters}
                onReroll={randomizeSingle}
              />
            );
          })}
        </ol>
      </section>
    </main>
  );
}
