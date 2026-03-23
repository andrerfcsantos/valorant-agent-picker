import type { Agent, Role } from "@/data/agents";
import { ROLES, getAllAgents, getAgentsByRole } from "@/data/agents";
import type { SlotConfig } from "@/lib/localStorage";
import SpriteIcon from "./SpriteIcon";
import RoleSpriteIcon from "./RoleSpriteIcon";
import styles from "./SquadSlot.module.css";

interface SquadSlotProps {
  index: number;
  config: SlotConfig;
  agent: Agent | null;
  onNameChange: (name: string) => void;
  onToggleAgent: (agentKey: string) => void;
  onToggleRoleAll: (role: Role) => void;
  onReroll: () => void;
}

export default function SquadSlot({
  index,
  config,
  agent,
  onNameChange,
  onToggleAgent,
  onToggleRoleAll,
  onReroll,
}: SquadSlotProps) {
  return (
    <div className={styles.slot}>
      <input
        className={styles.nameInput}
        type="text"
        placeholder={`Player ${index + 1}`}
        value={config.name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <div className={styles.agentRow}>
        {agent ? (
          <>
            <SpriteIcon
              className={styles.agentIcon}
              agentKey={agent.key}
              type="icon"
              alt={`${agent.name} icon`}
            />
            <span className={styles.agentName}>{agent.name}</span>
          </>
        ) : (
          <span className={styles.placeholder}>?</span>
        )}
        <button
          className={styles.rerollButton}
          onClick={onReroll}
          aria-label={`Re-roll slot ${index + 1}`}
          title="Re-roll"
        >
          ↻
        </button>
      </div>

      <details className={styles.filtersDetails}>
        <summary className={styles.filtersSummary}>
          Filters ({getAllAgents().length - config.disabledAgents.size})
          <span className={styles.filtersArrow}></span>
        </summary>
        <div className={styles.filtersPanel}>
          {ROLES.map((role) => {
            const roleAgents = getAgentsByRole(role.key);
            const disabledCount = roleAgents.filter((a) => config.disabledAgents.has(a.key)).length;
            const allEnabled = disabledCount === 0;
            const someDisabled = disabledCount > 0 && disabledCount < roleAgents.length;

            return (
              <div key={role.key} className={styles.roleSection}>
                <button
                  type="button"
                  className={styles.roleHeader}
                  onClick={() => onToggleRoleAll(role.key)}
                >
                  <RoleSpriteIcon
                    roleKey={role.key}
                    alt={role.label}
                    className={styles.roleIcon}
                  />
                  <span className={styles.roleLabel}>{role.label}</span>
                  <input
                    type="checkbox"
                    checked={allEnabled}
                    ref={(el) => {
                      if (el) el.indeterminate = someDisabled;
                    }}
                    onChange={() => onToggleRoleAll(role.key)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.roleCheckbox}
                  />
                </button>
                <div className={styles.agentList}>
                  {roleAgents.map((a) => (
                    <label key={a.key} className={styles.agentItem}>
                      <SpriteIcon
                        className={styles.agentItemIcon}
                        agentKey={a.key}
                        type="icon"
                        alt={a.name}
                      />
                      <span className={styles.agentItemName}>{a.name}</span>
                      <input
                        type="checkbox"
                        checked={!config.disabledAgents.has(a.key)}
                        onChange={() => onToggleAgent(a.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
