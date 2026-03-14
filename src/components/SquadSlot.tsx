import type { Agent, Role } from "@/data/agents";
import { ROLES } from "@/data/agents";
import type { SlotConfig } from "@/lib/localStorage";
import SpriteIcon from "./SpriteIcon";
import styles from "./SquadSlot.module.css";

interface SquadSlotProps {
  index: number;
  config: SlotConfig;
  agent: Agent | null;
  onNameChange: (name: string) => void;
  onToggleRole: (role: Role) => void;
  onReroll: () => void;
}

export default function SquadSlot({
  index,
  config,
  agent,
  onNameChange,
  onToggleRole,
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
          Filters<span className={styles.filtersArrow}></span>
        </summary>
        <div className={styles.filtersContent}>
          {ROLES.map((role) => (
            <label key={role.key} className={styles.roleCheckbox}>
              <input
                type="checkbox"
                checked={config.roleFilters.has(role.key)}
                onChange={() => onToggleRole(role.key)}
              />
              {role.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
