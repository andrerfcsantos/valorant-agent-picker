"use client";

import { useState } from "react";
import Link from "next/link";
import { SHARED_AGENT_ERRORS, type SharedAgent } from "@/hooks/useSharedAgent";
import RoleSpriteIcon from "./RoleSpriteIcon";
import ShareButton from "./ShareButton";
import SpriteIcon from "./SpriteIcon";
import styles from "./SharedContent.module.css";

/** The classic design of a shared agent roll. Its behaviour is `useSharedAgent`. */
export default function SharedAgentContent({
  shared: view,
}: {
  shared: SharedAgent;
}) {
  const [poolOpen, setPoolOpen] = useState(false);

  if (view.status === "loading") {
    return <div className={styles.container} />;
  }

  if (view.status === "invalid") {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>This link didn&apos;t open</h1>
          <p className={styles.errorText}>{SHARED_AGENT_ERRORS[view.reason]}</p>
          <div className={styles.actions}>
            <Link className={styles.linkBtn} href="/" prefetch={false}>
              Go to the agent picker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { agent, pool, rolls, handleReroll, presetHref, buildResultUrl } = view;

  return (
    <div className={styles.container}>
      <h1 className={styles.headline}>
        {view.ownRoll
          ? "Here's your agent"
          : "Someone randomized this agent for you"}
      </h1>

      {agent ? (
        <div className={styles.resultCard}>
          {view.picker.showPortrait && (
            <SpriteIcon
              key={`portrait-${agent.key}-${rolls}`}
              agentKey={agent.key}
              type="portrait"
              className={styles.portrait}
              alt={`${agent.name} portrait`}
            />
          )}

          <h2 key={`name-${rolls}`} className={styles.agentName}>
            <RoleSpriteIcon
              roleKey={agent.role}
              alt={agent.role}
              className={styles.roleIcon}
            />
            {agent.name}
          </h2>
        </div>
      ) : (
        <p className={styles.errorText}>
          This link points at an agent this version of the site doesn&apos;t
          know. Roll again to get one.
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={handleReroll}>
          Randomize again
        </button>
      </div>

      <div className={styles.secondaryRow}>
        <ShareButton
          className={styles.linkBtn}
          buildUrl={buildResultUrl}
          shareType="agent_result"
          shareSource="shared_agent"
          label="Share this roll"
        />
        {/*
          A full page load, not a client navigation: the picker reads the
          preset once on mount, so a router push would not apply it.
        */}
        <a
          className={styles.linkBtn}
          href={presetHref}
          title="Open the picker with these filters and options applied"
        >
          Open in the picker
        </a>
        <Link className={styles.linkBtn} href="/" prefetch={false}>
          Start fresh
        </Link>
      </div>

      <div className={styles.poolSummary}>
        <button
          className={styles.poolToggle}
          onClick={() => setPoolOpen(!poolOpen)}
        >
          {view.picker.selected.length === 0
            ? "Picked from all agents"
            : `Picked from ${pool.length} ${pool.length === 1 ? "agent" : "agents"}`}
          {poolOpen ? " ▾" : " ▸"}
        </button>

        {poolOpen && (
          <div className={styles.poolList}>
            {pool.map((poolAgent) => (
              <SpriteIcon
                key={poolAgent.key}
                agentKey={poolAgent.key}
                type="icon"
                className={styles.poolIcon}
                alt={poolAgent.name}
              />
            ))}
          </div>
        )}

        {view.picker.nonRepeating && (
          <p className={styles.optionsSummary}>
            Non-repeating mode is on, so a re-roll won&apos;t give the same
            agent twice.
          </p>
        )}
      </div>
    </div>
  );
}
