"use client";

import { useRef, useState } from "react";
import { preload } from "react-dom";
import Link from "next/link";
import { ROLES } from "@/data/agents";
import { SHARED_AGENT_ERRORS, type SharedAgent } from "@/hooks/useSharedAgent";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import ShareButton from "@/components/ShareButton";
import SpriteIcon from "@/components/SpriteIcon";
import { PORTRAIT_SPRITE } from "@/data/spriteMap";
import FeedbackBanner from "./FeedbackBanner";
import SealedCard from "./SealedCard";
import { useResultIntoView } from "./scroll";
import ui from "./ui.module.css";
import styles from "./Shared.module.css";

/**
 * The new design of the page a "Share this roll" link opens. A roll somebody
 * sent arrives sealed: a blank card where the portrait goes, the sender's
 * selection laid out beside it as the line-up of who it could be, and one
 * button to find out. After that it is the picker's rail, rolling from the sender's pool.
 */
export default function SharedAgentRefresh({
  shared,
}: {
  shared: SharedAgent;
}) {
  // Armed by the Reveal button, so only that turns the card over: not a
  // switch back from the classic design, which shows the result straight away.
  const [unveilArmed, setUnveilArmed] = useState(false);
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
  // The first portrait after the reveal turns over; later rolls land.
  const unveiling = unveilArmed && rolls === 0;
  // A line-up of just the rolled agent is the answer, so it waits for the
  // reveal too, and so does the link that would open it in the picker.
  const lineupHidden = sealed && pool.length === 1 && pool[0].key === agent.key;
  // Fetches the portrait sheet while the card is down, so the reveal does not
  // turn over onto an empty frame. The whole sheet says nothing of who it is.
  if (sealed && picker.showPortrait) {
    preload(PORTRAIT_SPRITE.src, { as: "image" });
  }
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
                {sealed ? (
                  // Not the portrait blurred: a blurred agent is still easy to
                  // tell by its colours and shape, so nothing of it is drawn.
                  <SealedCard className={styles.portrait} />
                ) : (
                  <SpriteIcon
                    key={rolls}
                    agentKey={agent.key}
                    type="portrait"
                    className={`${styles.portrait} ${unveiling ? styles.unveil : ""} ${rolls > 0 ? ui.land : ""}`}
                    alt={`${agent.name} portrait`}
                  />
                )}
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
            <button
              type="button"
              className={ui.roll}
              onClick={() => {
                setUnveilArmed(true);
                shared.reveal();
              }}
            >
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
              {lineupHidden
                ? "It is the only one selected"
                : sealed && inLineup
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
          {!lineupHidden && (
            <a
              className={`${ui.btn} ${ui.wrap}`}
              href={shared.presetHref}
              title="Open the picker with these agents selected and these roll settings"
            >
              Open this selection in the picker
            </a>
          )}
          <Link className={ui.btn} href="/" prefetch={false}>
            Use your own selection
          </Link>
        </div>

        {lineupHidden ? (
          <p className={styles.summary}>
            With only one agent to pick from, the selection would give it away,
            so it stays hidden until the reveal too.
          </p>
        ) : (
          groups.map((group) => (
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
                      <span className={styles.suspectName}>
                        {candidate.name}
                      </span>
                      {rolled && <span className={ui.vh}>, the roll</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </section>
    </main>
  );
}
