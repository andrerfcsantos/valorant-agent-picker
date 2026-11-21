"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ROLES, getAgentsByRole } from "@/data/agents";
import { useAgents } from "@/context/AgentContext";
import type { Picker } from "@/hooks/usePicker";
import { track } from "@/lib/analytics";
import AgentCard from "./AgentCard";
import PresetBar from "./PresetBar";
import ShareButton from "./ShareButton";
import SharedPresetNotice from "./SharedPresetNotice";
import SpriteIcon from "./SpriteIcon";
import RoleSpriteIcon from "./RoleSpriteIcon";
import styles from "./PickerContent.module.css";

/** The classic design of the random agent page. Its behaviour is `usePicker`. */
export default function PickerContent({ picker }: { picker: Picker }) {
  const {
    selectedAgents,
    toggleAgent,
    selectByRole,
    unselectByRole,
    selectOnlyRole,
    selectAll,
    unselectAll,
  } = useAgents();
  const {
    isHydrated,
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

  // Each roll blanks the name for a moment before the new one drops in, so
  // rolling the same agent twice still reads as a roll.
  // A layout effect, so the new name is never painted before it is hidden.
  // A reveal already on its way is left to finish, and shows whichever agent
  // is latest by then: restarting it on every roll would keep the name
  // hidden for as long as R is held down.
  const [nameVisible, setNameVisible] = useState(true);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => {
    if (agentCount === 0) return;
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- replays the name's entrance after each roll
    setNameVisible(false);
    if (revealTimer.current) return;
    revealTimer.current = setTimeout(() => {
      revealTimer.current = null;
      setNameVisible(true);
    }, 100);
  }, [agentCount]);
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = null;
    },
    [],
  );

  const numberOfSelected = selectedAgents.size;

  return (
    <div className={styles.mainContainer}>
      <div className={styles.row}>
        {sharedPresetApplied && (
          <div className={styles.noticeRow}>
            <SharedPresetNotice
              message="Filters and options from a shared link have been applied, replacing your own."
              onUndo={handleUndoShared}
              onDismiss={handleDismissShared}
            />
          </div>
        )}

        <div className={styles.leftContent}>
          <h1 className={styles.leftTitle}>You should play</h1>

          <details className={styles.optionsDetails}>
            <summary className={styles.optionsSummary}>
              &#9881; Options <span className={styles.optionsArrow}></span>
            </summary>
            <div className={styles.optionsContent}>
              <input
                id="checkbox-show-portrait"
                type="checkbox"
                checked={showPortrait}
                onChange={(e) => handleShowPortrait(e.target.checked)}
              />
              <label
                htmlFor="checkbox-show-portrait"
                className={styles.showPortraitLabel}
              >
                Show agent portrait
              </label>
              <span
                className="info-icon"
                data-tip="Show or hide the agent portrait image"
              >
                ⓘ
              </span>
              <br />
              <input
                id="checkbox-non-repeating"
                type="checkbox"
                checked={nonRepeating}
                onChange={(e) => handleNonRepeating(e.target.checked)}
              />
              <label
                htmlFor="checkbox-non-repeating"
                className={styles.showPortraitLabel}
              >
                Non-repeating mode
              </label>
              <span
                className="info-icon"
                data-tip="Prevent the same agent from being picked twice in a row"
              >
                ⓘ
              </span>
            </div>
          </details>

          <div className={styles.resultCard}>
            {showPortrait && (
              <div className={styles.portraitContainer}>
                {chosenAgent && (
                  <SpriteIcon
                    key={`portrait-${chosenAgent.key}-${agentCount}`}
                    className={styles.chosenAgentImage}
                    agentKey={chosenAgent.key}
                    type="portrait"
                    alt={`${chosenAgent.name} portrait`}
                  />
                )}
              </div>
            )}

            <h2
              key={`agent-name-${chosenAgent?.name}-${agentCount}`}
              className={`${styles.chosenAgentName} ${nameVisible ? "agent-name-visible" : "agent-name-enter"}`}
            >
              {isHydrated ? (chosenAgent?.name ?? "") : ""}
            </h2>

            {isHydrated && chosenAgent && (
              <div className={styles.resultActions}>
                <ShareButton
                  className={styles.allButton}
                  buildUrl={buildResultUrl}
                  shareType="agent_result"
                  shareSource="picker"
                  label="Share this agent"
                  copiedLabel="Agent link copied!"
                  title="Copy a link that reveals this agent"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.randomAgentButton}
            onClick={handleRandomAgent}
          >
            Randomize Agent
          </button>
        </div>

        <div className={styles.rightContent}>
          <h1 className={styles.rightTitle}>Filter Agents</h1>

          <p className={styles.pageDescription}>
            Select which agents you want to include for the random selection,
            then hit <strong>Randomize Agent</strong> to get your pick.
            <br />
            You can select/unselect agents individually, by role, or in one
            click with a preset. Keyboard shortcuts are available — click{" "}
            <strong>?</strong> on the bottom of the page to see the full list.
          </p>

          <div
            className={`${styles.filterDescription} ${styles.selectedAgentsInfo}`}
          >
            {numberOfSelected === 0 ? (
              <p
                className={`${styles.filterDescription} ${styles.selectedAgentsText}`}
              >
                You have no agents selected, so all agents are being considered
                by default.
              </p>
            ) : numberOfSelected === 1 ? (
              <p
                className={`${styles.filterDescription} ${styles.selectedAgentsText}`}
              >
                You have {numberOfSelected} agent selected.
              </p>
            ) : (
              <p
                className={`${styles.filterDescription} ${styles.selectedAgentsText}`}
              >
                You have {numberOfSelected} agents selected.
              </p>
            )}
            <div className={styles.globalSelectionButtons}>
              <button
                className={styles.allButton}
                onClick={() => {
                  selectAll();
                  track("agent_filters_changed", { action: "select_all" });
                }}
              >
                Select All
              </button>
              <button
                className={styles.allButton}
                onClick={() => {
                  unselectAll();
                  track("agent_filters_changed", { action: "unselect_all" });
                }}
              >
                Unselect All
              </button>
              <ShareButton
                className={styles.allButton}
                buildUrl={buildPresetUrl}
                shareType="picker_preset"
                shareSource="picker"
                label="Share these filters"
                copiedLabel="Filter link copied!"
                title="Copy a link that sets up these filters and options"
              />
            </div>
          </div>

          <PresetBar />

          {ROLES.map((role) => (
            <div key={role.key}>
              <div className={styles.filterHeader}>
                <RoleSpriteIcon
                  className={styles.roleIcon}
                  alt={`${role.label} role icon`}
                  roleKey={role.key}
                />
                <h2 className={styles.roleHeader}>{role.label}</h2>
                <button
                  className={`${styles.allButton} ${styles.selectAllButton}`}
                  onClick={() => {
                    selectByRole(role.key);
                    track("agent_filters_changed", {
                      action: "select_role",
                      role: role.key,
                    });
                  }}
                >
                  Select All
                </button>
                <button
                  className={`${styles.allButton} ${styles.unselectAllButton}`}
                  onClick={() => {
                    unselectByRole(role.key);
                    track("agent_filters_changed", {
                      action: "unselect_role",
                      role: role.key,
                    });
                  }}
                >
                  Unselect All
                </button>
                <button
                  className={`${styles.allButton} ${styles.justThisRoleButton}`}
                  onClick={() => {
                    selectOnlyRole(role.key);
                    track("agent_filters_changed", {
                      action: "select_only_role",
                      role: role.key,
                    });
                  }}
                >
                  Just This Role
                </button>
              </div>

              {getAgentsByRole(role.key).map((agent) => (
                <AgentCard
                  key={agent.key}
                  agent={agent}
                  selected={selectedAgents.has(agent.key)}
                  onToggle={() => toggleAgent(agent.key)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
