"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllAgents } from "@/data/agents";
import { ShareErrorReason } from "@/lib/share/binary";
import { tryDecodeShare } from "@/lib/share/codec";
import { PickerPreset } from "@/lib/share/types";
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
      picker: PickerPreset;
      agentKey: string | null;
      /** True once the visitor has rolled for themselves. */
      ownRoll: boolean;
    };

const ERROR_TEXT: Record<ShareErrorReason, string> = {
  "unsupported-version":
    "This link was made with a newer version of the site. Refresh the page and open it again.",
  corrupt:
    "This link looks like it was cut off or altered on the way here, so the agent it points at can't be trusted.",
  malformed: "This share link isn't valid.",
};

function pickRandom(
  pool: { key: string }[],
  nonRepeating: boolean,
  previousKey: string | null,
): string | null {
  if (pool.length === 0) return null;
  let candidates = pool;
  if (nonRepeating && previousKey && pool.length > 1) {
    candidates = pool.filter((agent) => agent.key !== previousKey);
  }
  return candidates[Math.floor(Math.random() * candidates.length)].key;
}

export default function SharedAgentContent() {
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [rolls, setRolls] = useState(0);
  const [poolOpen, setPoolOpen] = useState(false);

  // Read straight from the URL rather than useSearchParams: the page is
  // client-only, and this keeps the static export free of a Suspense boundary.
  useEffect(() => {
    const raw = readShareParam(window.location.search);
    const decoded = tryDecodeShare(raw);

    if (!decoded.ok) {
      setView({ status: "invalid", reason: decoded.reason });
      return;
    }

    // The kind travels inside the payload, so a link opened on the wrong page
    // can send itself where it belongs.
    if (decoded.payload.kind !== "agent-result") {
      window.location.replace(
        `${SHARE_PATHS[decoded.payload.kind]}?${SHARE_PARAM}=${raw}`,
      );
      return;
    }

    setView({
      status: "ready",
      picker: decoded.payload.picker,
      agentKey: decoded.payload.result.agentKey,
      ownRoll: false,
    });
  }, []);

  const pool = useMemo(() => {
    if (view.status !== "ready") return [];
    const all = getAllAgents();
    const selected = all.filter((agent) =>
      view.picker.selected.includes(agent.key),
    );
    // Matches the picker: no selection means every agent is in play.
    return selected.length > 0 ? selected : all;
  }, [view]);

  const handleReroll = useCallback(() => {
    if (view.status !== "ready" || pool.length === 0) return;
    const agentKey = pickRandom(
      pool,
      view.picker.nonRepeating,
      view.agentKey ?? null,
    );
    setView({ status: "ready", picker: view.picker, agentKey, ownRoll: true });
    setRolls((count) => count + 1);
    window.history.replaceState(
      null,
      "",
      sharePath({
        kind: "agent-result",
        picker: view.picker,
        result: { agentKey },
      }),
    );
  }, [view, pool]);

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
            <Link className={styles.linkBtn} href="/" prefetch={false}>
              Go to the agent picker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const agent = view.agentKey ? agentByKey.get(view.agentKey) : undefined;
  const presetHref = sharePath({ kind: "picker-preset", picker: view.picker });

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
          buildUrl={() =>
            shareUrl({
              kind: "agent-result",
              picker: view.picker,
              result: { agentKey: view.agentKey },
            })
          }
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
