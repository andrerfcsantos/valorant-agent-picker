"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ROLES, getAgentsByRole, getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import { useAgents } from "@/context/AgentContext";
import { usePresets } from "@/context/PresetContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  loadShowPortrait,
  saveShowPortrait,
  loadNonRepeating,
  saveNonRepeating,
} from "@/lib/localStorage";
import { SHORTCUT_COUNT, shortcutForIndex } from "@/lib/presets/types";
import { PickerPreset } from "@/lib/share/types";
import { shareUrl } from "@/lib/share/urls";
import { agentPoolProps, track } from "@/lib/analytics";
import AgentCard from "./AgentCard";
import PresetBar from "./PresetBar";
import ShareButton from "./ShareButton";
import SharedPresetNotice from "./SharedPresetNotice";
import SpriteIcon from "./SpriteIcon";
import RoleSpriteIcon from "./RoleSpriteIcon";
import styles from "./PickerContent.module.css";

/** The agents a roll picks from: the selection, or every agent if it is empty. */
function poolFor(selected: Set<string>): Agent[] {
  return selected.size > 0
    ? getAllAgents().filter((a) => selected.has(a.key))
    : getAllAgents();
}

function pickRandom(
  selected: Set<string>,
  previousKey?: string | null,
  nonRepeating?: boolean,
): Agent {
  const pool = poolFor(selected);
  if (nonRepeating && previousKey && pool.length > 1) {
    const filtered = pool.filter((a) => a.key !== previousKey);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

interface PickerOptions {
  showPortrait: boolean;
  nonRepeating: boolean;
}

export default function PickerContent() {
  const {
    selectedAgents,
    isHydrated,
    toggleAgent,
    selectByRole,
    unselectByRole,
    selectOnlyRole,
    selectAll,
    unselectAll,
    sharedPreset,
    sharedPresetApplied,
    undoSharedPreset,
    dismissSharedPreset,
  } = useAgents();
  const { presets, applyPreset } = usePresets();

  const [chosenAgent, setChosenAgent] = useState<Agent | null>(null);
  const [agentCount, setAgentCount] = useState(0);
  const [showPortrait, setShowPortrait] = useState(true);
  const [nonRepeating, setNonRepeating] = useState(false);
  const [nameVisible, setNameVisible] = useState(true);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const optionsBeforeShare = useRef<PickerOptions | null>(null);

  // Options are the picker's own state; the filters live in the provider. This
  // runs before the provider hydrates, so a shared preset still wins below.
  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- saved options are in localStorage, read after mount
    setShowPortrait(loadShowPortrait());
    setNonRepeating(loadNonRepeating());
  }, []);

  // A shared preset carries options as well as filters. The provider publishes
  // the decoded preset; putting the options into effect is the picker's job.
  useEffect(() => {
    if (!sharedPreset) return;
    // Read from storage rather than state: the values the link replaced are
    // still there, and they are what Undo has to put back.
    optionsBeforeShare.current = {
      showPortrait: loadShowPortrait(),
      nonRepeating: loadNonRepeating(),
    };
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the provider publishes a shared preset after mount
    setShowPortrait(sharedPreset.showPortrait);
    setNonRepeating(sharedPreset.nonRepeating);
    saveShowPortrait(sharedPreset.showPortrait);
    saveNonRepeating(sharedPreset.nonRepeating);
  }, [sharedPreset]);

  // The opening roll, once the filters it should respect are known. Later
  // filter changes leave the agent on screen alone.
  useEffect(() => {
    if (!isHydrated) return;
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the opening roll is random, so it waits for the client
    setChosenAgent((current) => current ?? pickRandom(selectedAgents));
  }, [isHydrated, selectedAgents]);

  const handleGetRandom = () => {
    setNameVisible(false);
    setTimeout(() => {
      const agent = pickRandom(selectedAgents, chosenAgent?.key, nonRepeating);
      setChosenAgent(agent);
      setAgentCount((c) => c + 1);
      setNameVisible(true);
      track("agent_randomized", {
        source: "picker",
        agent_key: agent.key,
        agent_role: agent.role,
        non_repeating: nonRepeating,
        ...agentPoolProps(poolFor(selectedAgents)),
      });
    }, 100);
  };

  // Only the visitor's own clicks: a shared preset and its undo also set
  // these options, and that must not look like clicks.
  const handleShowPortrait = (checked: boolean) => {
    setShowPortrait(checked);
    saveShowPortrait(checked);
    track("picker_option_changed", {
      option: "show_portrait",
      enabled: checked,
    });
  };

  const handleNonRepeating = (checked: boolean) => {
    setNonRepeating(checked);
    saveNonRepeating(checked);
    track("picker_option_changed", {
      option: "non_repeating",
      enabled: checked,
    });
  };

  const currentPreset = useCallback(
    (): PickerPreset => ({
      selected: Array.from(selectedAgents),
      showPortrait,
      nonRepeating,
    }),
    [selectedAgents, showPortrait, nonRepeating],
  );

  const buildResultUrl = useCallback(
    () =>
      shareUrl({
        kind: "agent-result",
        picker: currentPreset(),
        result: { agentKey: chosenAgent?.key ?? null },
      }),
    [currentPreset, chosenAgent],
  );

  const buildPresetUrl = useCallback(
    () => shareUrl({ kind: "picker-preset", picker: currentPreset() }),
    [currentPreset],
  );

  const handleUndoShared = useCallback(() => {
    const previous = optionsBeforeShare.current;
    if (previous) {
      setShowPortrait(previous.showPortrait);
      saveShowPortrait(previous.showPortrait);
      setNonRepeating(previous.nonRepeating);
      saveNonRepeating(previous.nonRepeating);
    }
    undoSharedPreset();
    track("shared_preset_undone", { share_type: "picker_preset" });
  }, [undoSharedPreset]);

  const handleDismissShared = useCallback(() => {
    dismissSharedPreset();
    track("shared_preset_dismissed", { share_type: "picker_preset" });
  }, [dismissSharedPreset]);

  const toggleRole = useCallback(
    (role: Role) => {
      const allOfRole = getAgentsByRole(role);
      const selectedOfRole = allOfRole.filter((a) => selectedAgents.has(a.key));
      if (selectedOfRole.length === allOfRole.length) {
        unselectByRole(role);
      } else {
        selectByRole(role);
      }
    },
    [selectedAgents, selectByRole, unselectByRole],
  );

  // The first ten presets answer to the number row, in list order. The order is
  // the visitor's to change, on the manage page.
  const presetShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {};
    presets.slice(0, SHORTCUT_COUNT).forEach((preset, index) => {
      const key = shortcutForIndex(index);
      if (key) map[key] = () => applyPreset(preset.id, "keyboard");
    });
    return map;
  }, [presets, applyPreset]);

  useKeyboardShortcuts({
    r: handleGetRandom,
    s: () => toggleRole("SENTINEL"),
    i: () => toggleRole("INITIATOR"),
    d: () => toggleRole("DUELIST"),
    c: () => toggleRole("CONTROLLER"),
    u: unselectAll,
    ...presetShortcuts,
  });

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
              ref={nameRef}
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
            onClick={handleGetRandom}
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
