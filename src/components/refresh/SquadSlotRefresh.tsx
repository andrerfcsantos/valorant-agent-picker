"use client";

import { useId, useState, useRef } from "react";
import { ROLES, getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import SpriteIcon from "@/components/SpriteIcon";
import { handOffFocus } from "./focus";
import { useResultIntoView } from "./scroll";
import PoolEditor from "./PoolEditor";
import ui from "./ui.module.css";
import styles from "./SquadSlotRefresh.module.css";

const ALL_AGENTS = getAllAgents();

interface SquadSlotRefreshProps {
  index: number;
  agent: Agent | null;
  name: string;
  /** Agents this player will not be given. */
  disabledAgents: Set<string>;
  /** Agents the other players in the squad have now. */
  takenByOthers: Set<string>;
  onNameChange: (index: number, name: string) => void;
  onDisabledChange: (index: number, disabled: Set<string>) => void;
  onResetFilters: (index: number) => void;
  onReroll: (index: number) => void;
}

/**
 * One player's row: who they are, what they rolled, and the pool they roll
 * from. The pool opens in place and is the same roster the picker uses.
 */
export default function SquadSlotRefresh({
  index,
  agent,
  name,
  disabledAgents,
  takenByOthers,
  onNameChange,
  onDisabledChange,
  onResetFilters,
  onReroll,
}: SquadSlotRefreshProps) {
  const [poolOpen, setPoolOpen] = useState(false);
  // "Select all" goes away once it has done its job, so focus moves to the
  // button that opened the pool rather than falling to the page.
  const poolToggle = useRef<HTMLButtonElement>(null);
  const poolId = useId();
  // A reroll from the button below the result, on a phone scrolled so the
  // button is near the top, changes the agent above the screen.
  const row = useRef<HTMLDivElement>(null);
  const [rerolls, setRerolls] = useState(0);
  useResultIntoView(row, rerolls, { ownRow: true });

  // Names the visitor types are theirs: shown as text only inside ph-mask,
  // which session replays mask, and never copied into an attribute (replays
  // mask text, not attributes). Labels use the player's number instead.
  const slotLabel = `Player ${index + 1}`;
  const player = name.trim() || slotLabel;
  const playerText = <span className="ph-mask">{player}</span>;
  const total = ALL_AGENTS.length;
  // Counted against the agents that exist, so a key left over from an agent that
  // has since been removed cannot push the count below what is on screen.
  const inCount = ALL_AGENTS.filter(
    (candidate) => !disabledAgents.has(candidate.key),
  ).length;
  // Players never share an agent, so when the others have taken every agent
  // selected for this one, the roll falls back to any agent left. A result
  // can also be outside the selection because the selection changed since.
  const outside =
    agent !== null && inCount > 0 && disabledAgents.has(agent.key);
  const othersHaveAll =
    outside &&
    ALL_AGENTS.every(
      (candidate) =>
        disabledAgents.has(candidate.key) || takenByOthers.has(candidate.key),
    );
  const poolLabel = `Selected: ${inCount === total ? `all ${total}` : `${inCount} of ${total}`}`;
  const roleLabel = agent
    ? (ROLES.find((role) => role.key === agent.role)?.label ?? "")
    : "";

  const toggleAgent = (agentKey: string) => {
    const next = new Set(disabledAgents);
    if (next.has(agentKey)) next.delete(agentKey);
    else next.add(agentKey);
    onDisabledChange(index, next);
  };

  const setRole = (role: Role, inPool: boolean) => {
    const next = new Set(disabledAgents);
    for (const candidate of ALL_AGENTS) {
      if (candidate.role !== role) continue;
      if (inPool) next.delete(candidate.key);
      else next.add(candidate.key);
    }
    onDisabledChange(index, next);
  };

  const onlyRole = (role: Role) => {
    onDisabledChange(
      index,
      new Set(
        ALL_AGENTS.filter((candidate) => candidate.role !== role).map(
          (candidate) => candidate.key,
        ),
      ),
    );
  };

  return (
    <li className={styles.slot}>
      <div ref={row} className={styles.row}>
        {agent ? (
          <SpriteIcon
            agentKey={agent.key}
            type="icon"
            alt=""
            className={styles.face}
          />
        ) : (
          <span className={`${styles.face} ${styles.faceEmpty}`} />
        )}

        <div className={styles.who} data-result>
          <input
            className={styles.nameInput}
            type="text"
            placeholder={`Player ${index + 1}`}
            aria-label={`Name of player ${index + 1}`}
            value={name}
            onChange={(e) => onNameChange(index, e.target.value)}
          />
          {agent ? (
            <div className={styles.result}>
              <span
                key={agent.key}
                className={`${styles.agentName} ${ui.land}`}
              >
                {agent.name}
              </span>
              <span className={styles.role}>
                <RoleSpriteIcon
                  roleKey={agent.role}
                  alt=""
                  className={ui.roleIcon}
                />
                {roleLabel}
              </span>
              {outside && (
                <span className={styles.outside}>
                  {/* What is true now, not why the roll went this way: the
                      selection may have changed since. */}
                  Not in {playerText}&apos;s current selection
                  {othersHaveAll
                    ? ", and the other players have all of it"
                    : ""}
                </span>
              )}
            </div>
          ) : (
            <p className={styles.none}>No agent left to give this player.</p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={ui.btn}
            aria-label={`Reroll ${slotLabel.toLowerCase()}`}
            data-roll-source
            onClick={() => {
              onReroll(index);
              setRerolls((count) => count + 1);
            }}
          >
            Reroll
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.caret}`}
            ref={poolToggle}
            aria-expanded={poolOpen}
            aria-controls={poolId}
            // Starts with the words on the button, so asking for it by what
            // it says finds it.
            aria-label={`${poolLabel}, ${slotLabel.toLowerCase()}`}
            onClick={() => setPoolOpen(!poolOpen)}
          >
            {poolLabel}
          </button>
        </div>
      </div>

      {poolOpen && (
        <div id={poolId} className={styles.pool}>
          <div className={styles.poolHead}>
            <span>
              {inCount === 0 ? (
                <>
                  No agents are selected for {playerText}, so they can be given
                  any agent.
                </>
              ) : (
                <>
                  {playerText} can be given{" "}
                  {inCount === total
                    ? `any of the ${total} agents`
                    : `${inCount} of ${total} agents`}
                  .
                </>
              )}
            </span>
            {inCount < total && (
              <button
                type="button"
                className={ui.link}
                ref={handOffFocus(() => poolToggle.current)}
                onClick={() => onResetFilters(index)}
              >
                Select all
              </button>
            )}
          </div>
          <PoolEditor
            compact
            label={slotLabel}
            isIn={(agentKey) => !disabledAgents.has(agentKey)}
            onToggleAgent={toggleAgent}
            onSetRole={setRole}
            onOnlyRole={onlyRole}
            currentAgentKey={agent?.key ?? null}
          />
        </div>
      )}
    </li>
  );
}
