"use client";

import { useRef } from "react";
import Link from "next/link";
import { ROLES } from "@/data/agents";
import { SHARED_AGENT_ERRORS, type SharedAgent } from "@/hooks/useSharedAgent";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import ShareButton from "@/components/ShareButton";
import SpriteIcon from "@/components/SpriteIcon";
import FeedbackBanner from "./FeedbackBanner";
import { useResultIntoView } from "./scroll";
import ui from "./ui.module.css";
import styles from "./Shared.module.css";

/**
 * The new design of the page a "Share this roll" link opens. A roll somebody
 * sent arrives sealed: the portrait out of focus, the sender's selection laid
 * out beside it as the line-up of who it could be, and one button to find
 * out. After that it is the picker's rail, rolling from the sender's pool.
 */
export default function SharedAgentRefresh({
  shared,
}: {
  shared: SharedAgent;
}) {
  // Hooks first: the early returns below would otherwise skip them.
  const rail = useRef<HTMLElement>(null);
  const ready = shared.status === "ready";
  const rolls = ready ? shared.rolls : 0;
  const revealed = ready && shared.revealed;
  useResultIntoView(rail, `${rolls}-${revealed}`);

  if (shared.status === "loading") {
    return <main className={`${ui.page} ${styles.blank}`} />;
  }

  if (shared.status === "invalid") {
    return (
      <main className={`${ui.page} ${styles.blank}`}>
        <div className={styles.problem}>
          <h1 className={styles.problemTitle}>This link didn&apos;t open</h1>
          <p>{SHARED_AGENT_ERRORS[shared.reason]}</p>
          <Link className={ui.btn} href="/" prefetch={false}>
            Go to the agent picker
          </Link>
        </div>
      </main>
    );
  }

  const { agent, pool, picker, ownRoll, handleReroll } = shared;

  // Only a roll somebody else made is sealed. An agent this version of the
  // site does not know has nothing to reveal.
  const sealed = !ownRoll && !shared.revealed && agent !== undefined;
  const roleLabel = agent
    ? (ROLES.find((role) => role.key === agent.role)?.label ?? "")
    : "";
  const announcement =
    sealed || !agent
      ? ""
      : ownRoll
        ? `Rolled ${agent.name}, ${roleLabel}.`
        : `It was ${agent.name}, ${roleLabel}.`;

  // A roll is shared with the selection as it is when the link is made, and
  // the selection may have changed since the roll. So the pool is described
  // as what rolling again uses, never as where the roll came from, and is
  // offered as the line-up only when the roll is in it.
  const inLineup = agent !== undefined && pool.some((a) => a.key === agent.key);

  const groups = ROLES.map((role) => ({
    ...role,
    agents: pool.filter((candidate) => candidate.role === role.key),
  })).filter((group) => group.agents.length > 0);

  return (
    <main className={`${ui.page} ${styles.app}`}>
      <section
        ref={rail}
        className={`${styles.rail} ${picker.showPortrait && agent ? "" : styles.noPortrait}`}
        aria-labelledby="shared-heading"
      >
        <h1 id="shared-heading" className={styles.lead}>
          {ownRoll ? "You should play" : "Someone rolled this for you"}
        </h1>

        {agent ? (
          <>
            {picker.showPortrait && (
              <div className={styles.portraitFrame}>
                <SpriteIcon
                  key={rolls}
                  agentKey={agent.key}
                  type="portrait"
                  className={`${styles.portrait} ${sealed ? styles.sealedPortrait : ""} ${rolls > 0 ? ui.land : ""}`}
                  // Sealed, the picture must not say who it is either.
                  alt={sealed ? "" : `${agent.name} portrait`}
                />
              </div>
            )}

            {sealed ? (
              <>
                <p className={styles.name} data-result>
                  {inLineup ? `One of ${pool.length}` : "Who is it?"}
                </p>
                <div className={styles.role}>Reveal it to see who</div>
              </>
            ) : (
              <>
                <p
                  key={`name-${rolls}`}
                  className={`${styles.name} ${ui.land}`}
                  data-result
                >
                  {agent.name}
                </p>
                <div className={styles.role}>
                  <RoleSpriteIcon
                    roleKey={agent.role}
                    alt=""
                    className={ui.roleIcon}
                  />
                  {roleLabel}
                </div>

                <div className={styles.actions}>
                  <ShareButton
                    className={ui.btn}
                    buildUrl={shared.buildResultUrl}
                    shareType="agent_result"
                    shareSource="shared_agent"
                    label="Share this roll"
                    copiedLabel="Roll link copied"
                    title="Copy a link that reveals this agent"
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <p className={styles.unknown}>
            This link points at an agent this version of the site doesn&apos;t
            know. Roll again to get one.
          </p>
        )}

        <div className={ui.rollBar} data-roll-bar>
          {sealed ? (
            <button type="button" className={ui.roll} onClick={shared.reveal}>
              Reveal the agent
            </button>
          ) : (
            <button type="button" className={ui.roll} onClick={handleReroll}>
              Roll again
            </button>
          )}
        </div>

        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces the reveal and each roll, not the result of a form */}
        <p className={ui.vh} role="status">
          <span key={rolls}>{announcement}</span>
        </p>
      </section>

      <section className={styles.side} aria-labelledby="shared-pool-heading">
        <FeedbackBanner />
        <div className={styles.head}>
          <div className={styles.headText}>
            <h2 id="shared-pool-heading" className={styles.title}>
              {sealed && inLineup
                ? "It is one of these"
                : "Rolling again picks from these"}
            </h2>
            <p className={styles.summary}>
              {shared.everyAgent
                ? `No agents were selected, so all ${pool.length} are in play.`
                : `${pool.length} ${pool.length === 1 ? "agent was" : "agents were"} selected.`}
              {/* With one agent there is no other to give. */}
              {picker.nonRepeating && pool.length > 1
                ? " Rolling again never gives the same agent twice in a row."
                : ""}
            </p>
          </div>
          {/* A full page load, not a client navigation: the picker reads a
              shared pool once, as it starts. */}
          <a
            className={ui.btn}
            href={shared.presetHref}
            title="Open the picker with these agents selected and these roll settings"
          >
            Open this selection in the picker
          </a>
          <Link className={ui.btn} href="/" prefetch={false}>
            Use your own selection
          </Link>
        </div>

        {groups.map((group) => (
          <section
            key={group.key}
            className={styles.group}
            aria-label={group.label}
          >
            <h3 className={styles.groupTitle}>
              <RoleSpriteIcon
                roleKey={group.key}
                alt=""
                className={`${ui.roleIcon} ${styles.groupIcon}`}
              />
              {group.label}
              <span className={styles.count}>{group.agents.length}</span>
            </h3>
            <ul className={styles.lineup}>
              {group.agents.map((candidate) => {
                const rolled = !sealed && candidate.key === agent?.key;
                return (
                  <li
                    key={candidate.key}
                    className={`${styles.suspect} ${rolled ? styles.rolled : ""}`}
                  >
                    <SpriteIcon
                      agentKey={candidate.key}
                      type="icon"
                      alt=""
                      className={styles.suspectIcon}
                    />
                    <span className={styles.suspectName}>{candidate.name}</span>
                    {rolled && <span className={ui.vh}>, the roll</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </section>
    </main>
  );
}
