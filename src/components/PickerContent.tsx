"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AGENTS, ROLES, getAgentsByRole, getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  loadSelectedAgents,
  saveSelectedAgents,
  loadShowPortrait,
  saveShowPortrait,
  loadNonRepeating,
  saveNonRepeating,
} from "@/lib/localStorage";
import { tryDecodeShare } from "@/lib/share/codec";
import { PickerPreset } from "@/lib/share/types";
import { readShareParam, shareUrl, stripShareParam } from "@/lib/share/urls";
import { sendEvent } from "@/lib/analytics";
import AgentCard from "./AgentCard";
import ShareButton from "./ShareButton";
import SharedPresetNotice from "./SharedPresetNotice";
import SpriteIcon from "./SpriteIcon";
import RoleSpriteIcon from "./RoleSpriteIcon";
import styles from "./PickerContent.module.css";

function pickRandom(
  selected: Set<string>,
  previousKey?: string | null,
  nonRepeating?: boolean,
): Agent {
  const pool =
    selected.size > 0
      ? getAllAgents().filter((a) => selected.has(a.key))
      : getAllAgents();
  if (nonRepeating && previousKey && pool.length > 1) {
    const filtered = pool.filter((a) => a.key !== previousKey);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

interface PickerSetup {
  selected: Set<string>;
  showPortrait: boolean;
  nonRepeating: boolean;
}

export default function PickerContent() {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(
    () => new Set(),
  );
  const [chosenAgent, setChosenAgent] = useState<Agent | null>(null);
  const [agentCount, setAgentCount] = useState(0);
  const [showPortrait, setShowPortrait] = useState(true);
  const [nonRepeating, setNonRepeating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [nameVisible, setNameVisible] = useState(true);
  const [sharedPresetApplied, setSharedPresetApplied] = useState(false);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const setupBeforeShare = useRef<PickerSetup | null>(null);

  const applySetup = useCallback((setup: PickerSetup) => {
    setSelectedAgents(setup.selected);
    setShowPortrait(setup.showPortrait);
    setNonRepeating(setup.nonRepeating);

    saveSelectedAgents(setup.selected);
    saveShowPortrait(setup.showPortrait);
    saveNonRepeating(setup.nonRepeating);

    setChosenAgent(pickRandom(setup.selected));
  }, []);

  // Hydrate from localStorage on mount, unless the URL carries a shared preset.
  useEffect(() => {
    const saved: PickerSetup = {
      selected:
        loadSelectedAgents() ?? new Set(getAllAgents().map((a) => a.key)),
      showPortrait: loadShowPortrait(),
      nonRepeating: loadNonRepeating(),
    };

    const shared = tryDecodeShare(readShareParam(window.location.search));
    if (shared.ok && shared.payload.kind === "picker-preset") {
      const preset = shared.payload.picker;
      setupBeforeShare.current = saved;
      applySetup({
        selected: new Set(preset.selected),
        showPortrait: preset.showPortrait,
        nonRepeating: preset.nonRepeating,
      });
      setSharedPresetApplied(true);
      stripShareParam();
    } else {
      setSelectedAgents(saved.selected);
      setShowPortrait(saved.showPortrait);
      setNonRepeating(saved.nonRepeating);
      setChosenAgent(pickRandom(saved.selected));
    }

    setHydrated(true);
  }, [applySetup]);

  const handleGetRandom = () => {
    setNameVisible(false);
    setTimeout(() => {
      const agent = pickRandom(selectedAgents, chosenAgent?.key, nonRepeating);
      setChosenAgent(agent);
      setAgentCount((c) => c + 1);
      setNameVisible(true);
      sendEvent("Agent", "GetRandom", agent.name);
    }, 100);
  };

  const toggleAgent = (key: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveSelectedAgents(next);
      const agent = AGENTS[key];
      const event = next.has(key) ? "SelectAgent" : "UnselectAgent";
      sendEvent("Filter", event, agent.name);
      return next;
    });
  };

  const selectByRole = useCallback((role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.add(a.key));
      saveSelectedAgents(next);
      sendEvent("Filter", "SelectRole", role);
      return next;
    });
  }, []);

  const unselectByRole = useCallback((role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.delete(a.key));
      saveSelectedAgents(next);
      sendEvent("Filter", "UnselectRole", role);
      return next;
    });
  }, []);

  const selectOnlyRole = (role: Role) => {
    const next = new Set<string>();
    getAgentsByRole(role).forEach((a) => next.add(a.key));
    setSelectedAgents(next);
    saveSelectedAgents(next);
    sendEvent("Filter", "SelectOnlyRole", role);
  };

  const handleShowPortrait = (checked: boolean) => {
    setShowPortrait(checked);
    saveShowPortrait(checked);
  };

  const handleNonRepeating = (checked: boolean) => {
    setNonRepeating(checked);
    saveNonRepeating(checked);
  };

  const unselectAll = useCallback(() => {
    setSelectedAgents(new Set());
    saveSelectedAgents(new Set());
    sendEvent("Filter", "UnselectAll", "All");
  }, []);

  const selectAll = useCallback(() => {
    const next = new Set(Object.keys(AGENTS));
    setSelectedAgents(next);
    saveSelectedAgents(next);
    sendEvent("Filter", "SelectAll", "All");
  }, []);

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
    const previous = setupBeforeShare.current;
    if (previous) applySetup(previous);
    setSharedPresetApplied(false);
  }, [applySetup]);

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

  useKeyboardShortcuts({
    r: handleGetRandom,
    s: () => toggleRole("SENTINEL"),
    i: () => toggleRole("INITIATOR"),
    d: () => toggleRole("DUELIST"),
    c: () => toggleRole("CONTROLLER"),
    u: unselectAll,
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
              onDismiss={() => setSharedPresetApplied(false)}
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
              {hydrated ? (chosenAgent?.name ?? "") : ""}
            </h2>

            {hydrated && chosenAgent && (
              <div className={styles.resultActions}>
                <ShareButton
                  className={styles.allButton}
                  buildUrl={buildResultUrl}
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
            You can select/unselect agents individually or by role. Keyboard
            shortcuts are available — click <strong>?</strong> on the bottom of
            the page to see the full list.
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
              <button className={styles.allButton} onClick={selectAll}>
                Select All
              </button>
              <button className={styles.allButton} onClick={unselectAll}>
                Unselect All
              </button>
              <ShareButton
                className={styles.allButton}
                buildUrl={buildPresetUrl}
                label="Share these filters"
                copiedLabel="Filter link copied!"
                title="Copy a link that sets up these filters and options"
              />
            </div>
          </div>

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
                  onClick={() => selectByRole(role.key)}
                >
                  Select All
                </button>
                <button
                  className={`${styles.allButton} ${styles.unselectAllButton}`}
                  onClick={() => unselectByRole(role.key)}
                >
                  Unselect All
                </button>
                <button
                  className={`${styles.allButton} ${styles.justThisRoleButton}`}
                  onClick={() => selectOnlyRole(role.key)}
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
