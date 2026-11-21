"use client";

import { useRef } from "react";
import Link from "next/link";
import { ROLES, getAllAgents } from "@/data/agents";
import { SHARED_SQUAD_ERRORS, type SharedSquad } from "@/hooks/useSharedSquad";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import ShareButton from "@/components/ShareButton";
import SpriteIcon from "@/components/SpriteIcon";
import FeedbackBanner from "./FeedbackBanner";
import { useResultIntoView } from "./scroll";
import ui from "./ui.module.css";
import styles from "./Shared.module.css";

const agentByKey = new Map(getAllAgents().map((agent) => [agent.key, agent]));

/**
 * The new design of the page a "Share this squad" link opens. A squad
 * somebody sent arrives sealed, one row per player with the agent out of
 * focus, and one button turns them over in order.
 */
export default function SharedSquadRefresh({
  shared,
}: {
  shared: SharedSquad;
}) {
  // Hooks first: the early returns below would otherwise skip them. The
  // reveal and a whole-squad reroll change every row, from a button fixed to
  // the bottom of a phone's screen; one player's reroll is made from that
  // player's row, which is already in view.
  const playerList = useRef<HTMLOListElement>(null);
  const ready = shared.status === "ready";
  const squadRolls = ready ? shared.squadRolls : 0;
  const revealed = ready && shared.revealed;
  useResultIntoView(playerList, `${squadRolls}-${revealed}`);

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
    squad.slots.slice(0, squad.size).some((slot) => slot !== null)
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
            <button type="button" className={ui.roll} onClick={shared.reveal}>
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
            className={ui.btn}
            href={shared.presetHref}
            title="Open the squad generator with these players and selections"
          >
            Open this setup in the generator
          </a>
          <Link className={ui.btn} href="/squad" prefetch={false}>
            Set up your own squad
          </Link>
        </div>

        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces the reveal and each roll, not the result of a form */}
        <p className={ui.vh} role="status">
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
          className={`${styles.players} ${rolls === 0 ? styles.inOrder : ""}`}
        >
          {players.map((player) => (
            <li
              key={player.index}
              className={styles.player}
              style={{ "--i": player.index } as React.CSSProperties}
            >
              {player.agent ? (
                <span className={styles.faceFrame}>
                  <SpriteIcon
                    agentKey={player.agent.key}
                    type="icon"
                    alt=""
                    className={`${styles.face} ${sealed ? styles.sealedFace : ""}`}
                  />
                </span>
              ) : (
                <span className={`${styles.faceFrame} ${styles.faceEmpty}`} />
              )}

              <div className={styles.who}>
                <span className={styles.playerName}>{player.name}</span>
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
                  aria-label={`Reroll ${player.name}`}
                  onClick={() => shared.handleRerollSlot(player.index)}
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
