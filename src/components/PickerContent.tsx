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
import { sendEvent } from "@/lib/analytics";
import AgentCard from "./AgentCard";
import SpriteIcon from "./SpriteIcon";
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
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Hydrate from localStorage on mount (client only)

  useEffect(() => {
    const saved =
      loadSelectedAgents() ?? new Set(getAllAgents().map((a) => a.key));
    setSelectedAgents(saved);
    setShowPortrait(loadShowPortrait());
    setNonRepeating(loadNonRepeating());
    setChosenAgent(pickRandom(saved));
    setHydrated(true);
  }, []);

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

  const selectByRole = (role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.add(a.key));
      saveSelectedAgents(next);
      sendEvent("Filter", "SelectRole", role);
      return next;
    });
  };

  const unselectByRole = (role: Role) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      getAgentsByRole(role).forEach((a) => next.delete(a.key));
      saveSelectedAgents(next);
      sendEvent("Filter", "UnselectRole", role);
      return next;
    });
  };

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
    <div className={`${styles.mainContainer} unselectable`}>
      <div className={styles.row}>
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

          <div
            className={styles.randomAgentButton}
            role="button"
            tabIndex={0}
            onClick={handleGetRandom}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleGetRandom();
            }}
          >
            Randomize Agent
          </div>
        </div>

        <div className={styles.rightContent}>
          <h1 className={styles.rightTitle}>Filter Agents</h1>

          <p className={styles.pageDescription}>
            Select which agents you want to include for the random selection,
            then hit <strong>Randomize Agent</strong> to get your pick.
            <br />
            You can select/unselect agents individually or by role.
            <br />
            Keyboard shortcuts are available — click <strong>?</strong> on the
            bottom of the page to see the full list.
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
          </div>

          {ROLES.map((role) => (
            <div key={role.key}>
              <div className={styles.filterHeader}>
                <img
                  className={styles.roleIcon}
                  alt={`${role.label} role icon`}
                  src={role.icon}
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
