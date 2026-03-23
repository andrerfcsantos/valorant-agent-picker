"use client";

import type { Agent } from "@/data/agents";
import SpriteIcon from "./SpriteIcon";
import styles from "./AgentCard.module.css";

interface AgentCardProps {
  agent: Agent;
  selected: boolean;
  onToggle: () => void;
}

export default function AgentCard({ agent, selected, onToggle }: AgentCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onToggle}
    >
      <SpriteIcon
        className={styles.image}
        agentKey={agent.key}
        type="icon"
        alt={`${agent.name} icon`}
      />
      <div className={styles.name}>{agent.name}</div>
    </button>
  );
}
