"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAllAgents } from "@/data/agents";
import {
  computeSquad,
  pickForSlot,
  slotConfigsFromEnabled,
} from "@/lib/squadService";
import { ShareErrorReason } from "@/lib/share/binary";
import { tryDecodeShare } from "@/lib/share/codec";
import { SquadPreset } from "@/lib/share/types";
import {
  SHARE_PARAM,
  SHARE_PATHS,
  readShareParam,
  sharePath,
  shareUrl,
} from "@/lib/share/urls";
import RoleSpriteIcon from "./RoleSpriteIcon";
import ShareButton from "./ShareButton";
import SpriteIcon from "./SpriteIcon";
import styles from "./SharedContent.module.css";

const agentByKey = new Map(getAllAgents().map((agent) => [agent.key, agent]));

type ViewState =
  | { status: "loading" }
  | { status: "invalid"; reason: ShareErrorReason }
  | {
      status: "ready";
      squad: SquadPreset;
      agents: (string | null)[];
      ownRoll: boolean;
    };

const ERROR_TEXT: Record<ShareErrorReason, string> = {
  "unsupported-version":
    "This link was made with a newer version of the site. Refresh the page and open it again.",
  corrupt:
    "This link looks like it was cut off or altered on the way here, so the squad it points at can't be trusted.",
  malformed: "This share link isn't valid.",
};

export default function SharedSquadContent() {
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [rolls, setRolls] = useState(0);

  useEffect(() => {
    const raw = readShareParam(window.location.search);
    const decoded = tryDecodeShare(raw);

    if (!decoded.ok) {
      setView({ status: "invalid", reason: decoded.reason });
      return;
    }

    if (decoded.payload.kind !== "squad-result") {
      window.location.replace(
        `${SHARE_PATHS[decoded.payload.kind]}?${SHARE_PARAM}=${raw}`,
      );
      return;
    }

    setView({
      status: "ready",
      squad: decoded.payload.squad,
      agents: decoded.payload.result.agents,
      ownRoll: false,
    });
  }, []);

  const publish = useCallback(
    (squad: SquadPreset, agents: (string | null)[]) => {
      setView({ status: "ready", squad, agents, ownRoll: true });
      setRolls((count) => count + 1);
      window.history.replaceState(
        null,
        "",
        sharePath({ kind: "squad-result", squad, result: { agents } }),
      );
    },
    [],
  );

  const handleReroll = useCallback(() => {
    if (view.status !== "ready") return;
    const { squad } = view;
    const configs = slotConfigsFromEnabled(squad.slots, squad.names);
    const rolled = computeSquad(configs, squad.size);
    publish(
      squad,
      rolled.map((agent) => agent?.key ?? null),
    );
  }, [view, publish]);

  const handleRerollSlot = useCallback(
    (index: number) => {
      if (view.status !== "ready") return;
      const { squad, agents } = view;
      const configs = slotConfigsFromEnabled(squad.slots, squad.names);
      const taken = new Set<string>();
      agents.forEach((key, i) => {
        if (i !== index && key) taken.add(key);
      });

      const agent = pickForSlot(configs[index].disabledAgents, taken);
      const next = [...agents];
      next[index] = agent?.key ?? null;
      publish(squad, next);
    },
    [view, publish],
  );

  if (view.status === "loading") {
    return <div className={styles.container} />;
  }

  if (view.status === "invalid") {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>This link didn&apos;t open</h1>
          <p className={styles.errorText}>{ERROR_TEXT[view.reason]}</p>
          <div className={styles.actions}>
            <Link className={styles.linkBtn} href="/squad" prefetch={false}>
              Go to the squad generator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { squad } = view;
  const presetHref = sharePath({ kind: "squad-preset", squad });

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
          buildUrl={() =>
            shareUrl({
              kind: "squad-result",
              squad,
              result: { agents: view.agents },
            })
          }
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
