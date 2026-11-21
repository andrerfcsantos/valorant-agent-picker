"use client";

import { ROLES, getAgentsByRole } from "@/data/agents";
import type { Role } from "@/data/agents";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import SpriteIcon from "@/components/SpriteIcon";
import ui from "./ui.module.css";
import styles from "./PoolEditor.module.css";

/** What "Only …" says for each role. */
const ONLY_LABEL: Record<Role, string> = {
  CONTROLLER: "Only controllers",
  SENTINEL: "Only sentinels",
  INITIATOR: "Only initiators",
  DUELIST: "Only duelists",
};

const ROLE_GROUPS = ROLES.map((role) => ({
  ...role,
  agents: getAgentsByRole(role.key),
}));

interface PoolEditorProps {
  /** Whether an agent is in the pool being edited. */
  isIn: (agentKey: string) => boolean;
  onToggleAgent: (agentKey: string) => void;
  /** Puts a whole role in the pool, or takes it out. */
  onSetRole: (role: Role, inPool: boolean) => void;
  /** Makes the pool exactly one role. */
  onOnlyRole: (role: Role) => void;
  /** Marked in the grid, so the roll and the roster visibly agree. */
  currentAgentKey?: string | null;
  /** Says what the pool is for, read out with each role ("Player 2, Duelist"). */
  label?: string;
  /** Tighter spacing, for a pool edited inside something else. */
  compact?: boolean;
  /**
   * For a roster that has a page's width to itself: where there is room, each
   * role's name and its controls stand beside its agents instead of above
   * them, which is three rows the page gets back.
   */
  rail?: boolean;
}

/**
 * The roster, grouped by role. An agent in the pool is a plain tile; one left
 * out is hollow. A full pool, the usual case, is therefore the calmest thing
 * the grid can show, and the exceptions are what the eye lands on.
 *
 * Used for the picker's pool and for each squad slot's, so the two cannot
 * drift apart.
 */
export default function PoolEditor({
  isIn,
  onToggleAgent,
  onSetRole,
  onOnlyRole,
  currentAgentKey = null,
  label,
  compact = false,
  rail = false,
}: PoolEditorProps) {
  return (
    <div
      className={`${compact ? styles.compact : ""} ${rail ? styles.rail : ""}`}
    >
      {ROLE_GROUPS.map(({ key, label: roleLabel, agents }) => {
        const inCount = agents.filter((agent) => isIn(agent.key)).length;
        const all = inCount === agents.length;
        return (
          <section
            key={key}
            className={styles.group}
            aria-label={label ? `${label}, ${roleLabel}` : roleLabel}
          >
            <div className={styles.groupHead}>
              <label className={styles.roleCheck}>
                <input
                  type="checkbox"
                  className={ui.check}
                  checked={all}
                  ref={(input) => {
                    if (input) input.indeterminate = inCount > 0 && !all;
                  }}
                  // A partly filled role fills up first, as a tri-state
                  // checkbox is expected to.
                  onChange={() => onSetRole(key, !all)}
                />
                <RoleSpriteIcon
                  roleKey={key}
                  alt=""
                  className={`${ui.roleIcon} ${styles.groupIcon}`}
                />
                {roleLabel}
              </label>
              <span className={styles.count}>
                {inCount} of {agents.length}
              </span>
              <button
                type="button"
                className={`${ui.link} ${styles.only}`}
                onClick={() => onOnlyRole(key)}
              >
                {ONLY_LABEL[key]}
              </button>
            </div>
            <ul className={styles.tiles}>
              {agents.map((agent) => {
                const inPool = isIn(agent.key);
                return (
                  <li key={agent.key}>
                    <button
                      type="button"
                      className={`${styles.agent} ${agent.key === currentAgentKey ? styles.current : ""}`}
                      aria-pressed={inPool}
                      onClick={() => onToggleAgent(agent.key)}
                    >
                      <SpriteIcon
                        agentKey={agent.key}
                        type="icon"
                        alt=""
                        className={styles.agentIcon}
                      />
                      <span className={styles.agentName}>{agent.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
