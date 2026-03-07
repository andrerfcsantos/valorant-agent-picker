"use client";

import type { Agent } from "@/data/agents";
import styles from "./AgentCard.module.css";

interface AgentCardProps {
  agent: Agent;
  selected: boolean;
  onToggle: () => void;
}

export default function AgentCard({ agent, selected, onToggle }: AgentCardProps) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onToggle}
    >
      <img
        className={styles.image}
        src={`/imgs/agents/icons/${agent.key}.png`}
        alt={`${agent.name} icon`}
      />
      <div className={styles.name}>{agent.name}</div>
    </div>
  );
}
