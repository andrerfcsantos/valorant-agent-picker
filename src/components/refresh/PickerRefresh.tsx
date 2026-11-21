"use client";

import { useRef } from "react";
import { ROLES } from "@/data/agents";
import type { Picker } from "@/hooks/usePicker";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import ShareButton from "@/components/ShareButton";
import SharedPresetNotice from "@/components/SharedPresetNotice";
import SpriteIcon from "@/components/SpriteIcon";
import FeedbackBanner from "./FeedbackBanner";
import { useResultIntoView } from "./scroll";
import AgentPool from "./AgentPool";
import ui from "./ui.module.css";
import styles from "./PickerRefresh.module.css";

/**
 * The new design of the random agent page: the roll in a rail that stays put,
 * the agent pool beside it. Its behaviour is `usePicker`, shared with the
 * classic design.
 */
export default function PickerRefresh({ picker }: { picker: Picker }) {
  const {
    chosenAgent,
    agentCount,
    showPortrait,
    nonRepeating,
    handleRandomAgent,
    handleShowPortrait,
    handleNonRepeating,
    buildResultUrl,
    buildPresetUrl,
    sharedPresetApplied,
    handleUndoShared,
    handleDismissShared,
  } = picker;

  const rail = useRef<HTMLElement>(null);
  useResultIntoView(rail, agentCount);

  const roleLabel = chosenAgent
    ? (ROLES.find((role) => role.key === chosenAgent.role)?.label ?? "")
    : "";

  // Read out after a roll the visitor asked for. The opening agent is on the
  // page when it loads, so it is not announced as news.
  const announcement =
    chosenAgent && agentCount > 0
      ? `Rolled ${chosenAgent.name}, ${roleLabel}.`
      : "";

  return (
    <main className={`${ui.page} ${styles.app}`}>
      <section
        ref={rail}
        className={`${styles.rail} ${showPortrait ? "" : styles.noPortrait}`}
        aria-labelledby="picker-heading"
      >
        {/* Focusable from script only: it takes focus when the design is
            switched from the invitation, whose own button is removed. */}
        <h1 id="picker-heading" className={styles.lead} tabIndex={-1}>
          You should play
        </h1>

        {chosenAgent && (
          <>
            {showPortrait && (
              <div className={styles.portraitFrame}>
                <SpriteIcon
                  key={agentCount}
                  agentKey={chosenAgent.key}
                  type="portrait"
                  className={`${styles.portrait} ${ui.land}`}
                  alt={`${chosenAgent.name} portrait`}
                />
              </div>
            )}

            <p
              key={`name-${agentCount}`}
              className={`${styles.name} ${ui.land}`}
            >
              {chosenAgent.name}
            </p>
            <div className={styles.role}>
              <RoleSpriteIcon
                roleKey={chosenAgent.role}
                alt=""
                className={ui.roleIcon}
              />
              {roleLabel}
            </div>

            <div className={styles.actions}>
              <ShareButton
                className={ui.btn}
                buildUrl={buildResultUrl}
                shareType="agent_result"
                shareSource="picker"
                label="Share this roll"
                copiedLabel="Roll link copied"
                title="Copy a link that reveals this agent"
              />
            </div>
          </>
        )}

        <div className={ui.rollBar} data-roll-bar>
          <button type="button" className={ui.roll} onClick={handleRandomAgent}>
            Roll an agent
            <kbd className={ui.kbd} aria-hidden="true">
              R
            </kbd>
          </button>
        </div>

        <details className={styles.settings}>
          <summary>Roll settings</summary>
          <label className={ui.option}>
            <input
              type="checkbox"
              className={ui.check}
              checked={showPortrait}
              onChange={(e) => handleShowPortrait(e.target.checked)}
            />
            Show the agent portrait
          </label>
          <label className={ui.option}>
            <input
              type="checkbox"
              className={ui.check}
              checked={nonRepeating}
              onChange={(e) => handleNonRepeating(e.target.checked)}
            />
            Never roll the same agent twice in a row
          </label>
        </details>

        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces each roll, not the result of a form */}
        <p className={ui.vh} role="status">
          {/* Keyed by roll: a screen reader stays silent when a live region is
              set to the text it already holds, as rolling the same agent
              twice would. A new node is always news. */}
          <span key={agentCount}>{announcement}</span>
        </p>
      </section>

      <div className={styles.side}>
        <div className={styles.feedback}>
          <FeedbackBanner />
        </div>
        {sharedPresetApplied && (
          <div className={styles.notice}>
            <SharedPresetNotice
              message="A shared link selected these agents and set these roll settings, replacing your own."
              onUndo={handleUndoShared}
              onDismiss={handleDismissShared}
            />
          </div>
        )}
        <AgentPool
          currentAgentKey={chosenAgent?.key ?? null}
          buildPresetUrl={buildPresetUrl}
        />
      </div>
    </main>
  );
}
