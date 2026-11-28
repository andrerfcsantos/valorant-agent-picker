"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ROLES, getAllAgents } from "@/data/agents";
import { slotNarrows } from "@/lib/squadService";
import { SHARED_SQUAD_ERRORS, type SharedSquad } from "@/hooks/useSharedSquad";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import ShareButton from "@/components/ShareButton";
import SpriteIcon from "@/components/SpriteIcon";
import FeedbackBanner from "./FeedbackBanner";
import SealedCard from "./SealedCard";
import { useResultIntoView } from "./scroll";
import ui from "./ui.module.css";
import styles from "./Shared.module.css";

const agentByKey = new Map(getAllAgents().map((agent) => [agent.key, agent]));

/**
 * The new design of the page a "Share this squad" link opens. A squad
 * somebody sent arrives sealed, one row per player with a blank card where the
 * agent goes, and one button turns them over in order.
 */
export default function SharedSquadRefresh({
  shared,
}: {
  shared: SharedSquad;
}) {
  // Armed by the Reveal button, so only that turns the card over: not a
  // switch back from the classic design, which shows the result straight away.
  const [unveilArmed, setUnveilArmed] = useState(false);
  // Hooks first: the early returns below would otherwise skip them. The
  // reveal and a whole-squad reroll change every row, from a button fixed to
  // the bottom of a phone's screen; one player's reroll is made from that
  // player's row, which is already in view.
  const playerList = useRef<HTMLOListElement>(null);
  const ready = shared.status === "ready";
  const squadRolls = ready ? shared.squadRolls : 0;
  const revealed = ready && shared.revealed;
  useResultIntoView(playerList, `${squadRolls}-${revealed}`);
  // One player's reroll, from the button below their result: on a phone
  // scrolled so the button is near the top, the agent changes above it.
  const rerolledRow = useRef<HTMLElement | null>(null);
  const [rowRerolls, setRowRerolls] = useState(0);
  useResultIntoView(rerolledRow, rowRerolls, { ownRow: true });

  if (shared.status === "loading") {
    return <main className={`${ui.page} ${styles.blank}`} />;
  }

  if (shared.status === "invalid") {
    return (
      <main className={`${ui.page} ${styles.blank}`}>
        <div className={styles.problem}>
          <h1 className={styles.problemTitle}>This link didn&apos;t open</h1>
          <p>{SHARED_SQUAD_ERRORS[shared.reason]}</p>
          <Link className={ui.btn} href="/squad" prefetch={false}>
            Go to the squad generator
          </Link>
        </div>
      </main>
    );
  }

  const { squad, agents, ownRoll, rolls, handleReroll } = shared;
  const sealed = !ownRoll && !shared.revealed;
  // The first faces after the reveal turn over; later rolls just swap them.
  const unveiling = unveilArmed && rolls === 0;

  const players = Array.from({ length: squad.size }, (_, index) => {
    const agentKey = agents[index] ?? null;
    const agent = agentKey ? agentByKey.get(agentKey) : undefined;
    return {
      index,
      name: squad.names[index]?.trim() || `Player ${index + 1}`,
      agent,
      roleLabel: agent
        ? (ROLES.find((role) => role.key === agent.role)?.label ?? "")
        : "",
    };
  });

  const facts = [
    squad.size === 1 ? "1 player" : `${squad.size} players`,
    "Every player gets a different agent",
    squad.slots.slice(0, squad.size).some(slotNarrows)
      ? "Some players roll from their own selection"
      : null,
  ].filter((fact): fact is string => fact !== null);

  const announcement = sealed
    ? ""
    : `Squad: ${players.map((player) => `${player.name}, ${player.agent?.name ?? "nobody"}`).join("; ")}.`;

  return (
    <main className={`${ui.page} ${styles.app}`}>
      <section className={styles.squadRail} aria-labelledby="shared-heading">
        <h1 id="shared-heading" className={styles.title}>
          {ownRoll ? "Your squad" : "Someone rolled this squad for you"}
        </h1>

        <ul className={styles.facts}>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>

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
              Reveal the squad
            </button>
          ) : (
            <button type="button" className={ui.roll} onClick={handleReroll}>
              Roll the squad again
            </button>
          )}
        </div>

        <div className={styles.railActions}>
          {!sealed && (
            <ShareButton
              className={ui.btn}
              buildUrl={shared.buildResultUrl}
              shareType="squad_result"
              shareSource="shared_squad"
              label="Share this squad"
              copiedLabel="Squad link copied"
              title="Copy a link that reveals this squad"
            />
          )}
          {/* Full page load so the squad generator reads the setup as it starts. */}
          <a
            className={`${ui.btn} ${ui.wrap}`}
            href={shared.presetHref}
            title="Open the squad generator with these players and selections"
          >
            Open this setup in the generator
          </a>
          <Link className={ui.btn} href="/squad" prefetch={false}>
            Set up your own squad
          </Link>
        </div>

        {/* Masked in session replays: it carries the players' names. */}
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces the reveal and each roll, not the result of a form */}
        <p className={`${ui.vh} ph-mask`} role="status">
          <span key={rolls}>{announcement}</span>
        </p>
      </section>

      <section className={styles.side} aria-labelledby="shared-squad-heading">
        <FeedbackBanner />
        <h2 id="shared-squad-heading" className={styles.title}>
          {sealed ? "Who got whom" : "The squad"}
        </h2>

        <ol
          ref={playerList}
          className={`${styles.players} ${rolls === 0 ? styles.inOrder : ""} ${unveiling ? styles.revealing : ""}`}
        >
          {players.map((player) => (
            <li
              key={player.index}
              className={styles.player}
              style={{ "--i": player.index } as React.CSSProperties}
            >
              {player.agent ? (
                <span className={styles.faceFrame}>
                  {sealed ? (
                    <SealedCard className={styles.face} />
                  ) : (
                    <>
                      <SpriteIcon
                        agentKey={player.agent.key}
                        type="icon"
                        alt=""
                        className={`${styles.face} ${unveiling ? styles.unveil : ""}`}
                      />
                      {/* The card stays a moment to turn away first. */}
                      {unveiling && (
                        <SealedCard
                          className={`${styles.face} ${styles.cardOut}`}
                        />
                      )}
                    </>
                  )}
                </span>
              ) : (
                <span className={`${styles.faceFrame} ${styles.faceEmpty}`} />
              )}

              <div className={styles.who} data-result>
                <span className={`${styles.playerName} ph-mask`}>
                  {player.name}
                </span>
                {sealed ? (
                  <span className={styles.redacted}>
                    <span className={ui.vh}>Hidden until revealed</span>
                  </span>
                ) : player.agent ? (
                  <span className={styles.result}>
                    <span
                      key={`${player.agent.key}-${rolls}`}
                      className={`${styles.agentName} ${ui.land}`}
                    >
                      {player.agent.name}
                    </span>
                    <span className={styles.role}>
                      <RoleSpriteIcon
                        roleKey={player.agent.role}
                        alt=""
                        className={ui.roleIcon}
                      />
                      {player.roleLabel}
                    </span>
                  </span>
                ) : (
                  <span className={styles.none}>
                    No agent left to give this player.
                  </span>
                )}
              </div>

              {!sealed && (
                <button
                  type="button"
                  className={`${ui.btn} ${styles.playerReroll}`}
                  // By number: a name in an attribute would reach session
                  // replays, which mask text but not attributes.
                  aria-label={`Reroll player ${player.index + 1}`}
                  data-roll-source
                  onClick={(event) => {
                    shared.handleRerollSlot(player.index);
                    rerolledRow.current = event.currentTarget.closest("li");
                    setRowRerolls((count) => count + 1);
                  }}
                >
                  Reroll
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
