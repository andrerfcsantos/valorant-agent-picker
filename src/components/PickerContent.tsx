"use client";

import { useState, useRef, useSyncExternalStore } from "react";
import { AGENTS, ROLES, getAgentsByRole, getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import {
  loadSelectedAgents,
  saveSelectedAgents,
  loadShowPortrait,
  saveShowPortrait,
} from "@/lib/localStorage";
import { sendEvent } from "@/lib/analytics";
import AgentCard from "./AgentCard";
import styles from "./PickerContent.module.css";

function pickRandom(selected: Set<string>): Agent {
  const pool =
    selected.size > 0
      ? getAllAgents().filter((a) => selected.has(a.key))
      : getAllAgents();
  return pool[Math.floor(Math.random() * pool.length)];
}

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function getInitialSelected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return loadSelectedAgents();
}

function getInitialPortrait(): boolean {
  if (typeof window === "undefined") return true;
  return loadShowPortrait();
}

export default function PickerContent() {
  const isClient = useIsClient();
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(getInitialSelected);
  const [chosenAgent, setChosenAgent] = useState<Agent | null>(() =>
    typeof window === "undefined" ? null : pickRandom(getInitialSelected()),
  );
  const [agentCount, setAgentCount] = useState(0);
  const [showPortrait, setShowPortrait] = useState<boolean>(getInitialPortrait);
  const [nameVisible, setNameVisible] = useState(true);
  const nameRef = useRef<HTMLHeadingElement>(null);

  const handleGetRandom = () => {
    setNameVisible(false);
    setTimeout(() => {
      const agent = pickRandom(selectedAgents);
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

  const handleShowPortrait = (checked: boolean) => {
    setShowPortrait(checked);
    saveShowPortrait(checked);
  };

  const numberOfSelected = selectedAgents.size;

  return (
    <div className={`${styles.mainContainer} unselectable`}>
      <div className={styles.row}>
        <div className={styles.leftContent}>
          <h1 className={styles.leftTitle}>You should play</h1>

          <div>
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
          </div>

          {showPortrait && chosenAgent && (
            <img
              className={styles.chosenAgentImage}
              src={`/imgs/agents/portraits/${chosenAgent.key}.png`}
              alt={`${chosenAgent.name} portrait`}
            />
          )}

          <h2
            ref={nameRef}
            key={`agent-name-${chosenAgent?.name}-${agentCount}`}
            className={`${styles.chosenAgentName} ${nameVisible ? "agent-name-visible" : "agent-name-enter"}`}
          >
            {isClient ? chosenAgent?.name ?? "" : ""}
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
            Get Random Agent
          </div>
        </div>

        <div className={styles.rightContent}>
          <h1 className={styles.rightTitle}>Filter Agents</h1>

          <p className={styles.filterDescription}>
            Select the agents you wish to play and click in the &quot;Get Random
            Agent&quot; button to get a random agent from the selected ones.
          </p>

          <div className={`${styles.filterDescription} ${styles.selectedAgentsInfo}`}>
            {numberOfSelected === 0 ? (
              <p className={`${styles.filterDescription} ${styles.selectedAgentsText}`}>
                You have no agents selected, so all agents are being considered
                by default.
              </p>
            ) : numberOfSelected === 1 ? (
              <p className={`${styles.filterDescription} ${styles.selectedAgentsText}`}>
                You have {numberOfSelected} agent selected.
              </p>
            ) : (
              <p className={`${styles.filterDescription} ${styles.selectedAgentsText}`}>
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
