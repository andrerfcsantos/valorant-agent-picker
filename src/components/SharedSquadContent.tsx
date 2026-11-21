"use client";

import Link from "next/link";
import { getAllAgents } from "@/data/agents";
import { SHARED_SQUAD_ERRORS, type SharedSquad } from "@/hooks/useSharedSquad";
import RoleSpriteIcon from "./RoleSpriteIcon";
import ShareButton from "./ShareButton";
import SpriteIcon from "./SpriteIcon";
import styles from "./SharedContent.module.css";

const agentByKey = new Map(getAllAgents().map((agent) => [agent.key, agent]));

/** The classic design of a shared squad. Its behaviour is `useSharedSquad`. */
export default function SharedSquadContent({
  shared: view,
}: {
  shared: SharedSquad;
}) {
  if (view.status === "loading") {
    return <div className={styles.container} />;
  }

  if (view.status === "invalid") {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>This link didn&apos;t open</h1>
          <p className={styles.errorText}>{SHARED_SQUAD_ERRORS[view.reason]}</p>
          <div className={styles.actions}>
            <Link className={styles.linkBtn} href="/squad" prefetch={false}>
              Go to the squad generator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { squad, rolls, handleReroll, handleRerollSlot, presetHref } = view;

  return (
    <div className={styles.container}>
      <h1 className={styles.headline}>
        {view.ownRoll
          ? "Here's your squad"
          : "Someone randomized this squad for you"}
      </h1>

      <div className={styles.slots}>
        {Array.from({ length: squad.size }, (_, index) => {
          const agentKey = view.agents[index] ?? null;
          const agent = agentKey ? agentByKey.get(agentKey) : undefined;
          const name = squad.names[index] ?? "";

          return (
            <div className={styles.slot} key={index}>
              <span
                className={`${styles.slotName} ${name ? "" : styles.slotNamePlaceholder}`}
              >
                {name || `Player ${index + 1}`}
              </span>

              {agent ? (
                <div
                  className={styles.slotAgentRow}
                  key={`agent-${index}-${rolls}`}
                >
                  <SpriteIcon
                    className={styles.slotAgentIcon}
                    agentKey={agent.key}
                    type="icon"
                    alt={`${agent.name} icon`}
                  />
                  <RoleSpriteIcon
                    className={styles.slotRoleIcon}
                    roleKey={agent.role}
                    alt={agent.role}
                  />
                  <span className={styles.slotAgentName}>{agent.name}</span>
                  <button
                    className={styles.slotReroll}
                    onClick={() => handleRerollSlot(index)}
                    title="Re-roll this slot"
                  >
                    ↻
                  </button>
                </div>
              ) : (
                <div className={styles.slotEmpty}>—</div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={handleReroll}>
          Randomize again
        </button>
      </div>

      <div className={styles.secondaryRow}>
        <ShareButton
          className={styles.linkBtn}
          buildUrl={view.buildResultUrl}
          shareType="squad_result"
          shareSource="shared_squad"
          label="Share this squad"
        />
        {/* Full page load so the squad generator reads the preset on mount. */}
        <a
          className={styles.linkBtn}
          href={presetHref}
          title="Open the squad generator with this setup applied"
        >
          Open in the generator
        </a>
        <Link className={styles.linkBtn} href="/squad" prefetch={false}>
          Start fresh
        </Link>
      </div>

      <p className={styles.optionsSummary}>
        {squad.size} {squad.size === 1 ? "agent" : "agents"}
        {squad.slots.some((slot) => slot !== null)
          ? " · slot filters included"
          : ""}
      </p>
    </div>
  );
}
