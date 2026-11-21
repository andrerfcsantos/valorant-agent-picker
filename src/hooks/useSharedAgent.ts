"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllAgents } from "@/data/agents";
import { useDesign } from "@/context/DesignContext";
import { agentPoolProps, track } from "@/lib/analytics";
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

/**
 * A shared roll: the agent somebody sent, the pool and settings it came from,
 * and rolling again from them. Both designs' share pages are views of this.
 */
export function useSharedAgent() {
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [rolls, setRolls] = useState(0);
  // Kept here rather than in the new design's view, so switching design and
  // back does not seal a roll the visitor has already seen.
  const [revealed, setRevealed] = useState(false);
  const { design, ready: designReady } = useDesign();
  const loaded = view.status === "ready";

  // The classic design shows a shared roll straight away, so once it has been
  // on screen there is nothing left to reveal in the new one, and no reveal
  // to report.
  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the design is only known after mount
    if (designReady && design === "classic" && loaded) setRevealed(true);
  }, [designReady, design, loaded]);

  // Read straight from the URL rather than useSearchParams: the page is
  // client-only, and this keeps the static export free of a Suspense boundary.
  useEffect(() => {
    const raw = readShareParam(window.location.search);
    const decoded = tryDecodeShare(raw);

    if (!decoded.ok) {
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- the share link is in the URL, which only exists after mount
      setView({ status: "invalid", reason: decoded.reason });
      track("shared_link_opened", {
        share_type: "unknown",
        valid: false,
        invalid_reason: decoded.reason,
      });
      return;
    }

    // The kind travels inside the payload, so a link opened on the wrong page
    // can send itself where it belongs. The destination reports the open.
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
    track("shared_link_opened", { share_type: "agent_result", valid: true });
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
    const agent = agentKey ? agentByKey.get(agentKey) : undefined;
    if (agent) {
      track("agent_randomized", {
        source: "shared_result",
        agent_key: agent.key,
        agent_role: agent.role,
        non_repeating: view.picker.nonRepeating,
        ...agentPoolProps(pool),
      });
    }
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

  if (view.status !== "ready") return view;

  return {
    status: "ready" as const,
    /**
     * True once the visitor has asked to see a roll somebody sent, or has
     * seen it already in the classic design.
     */
    revealed,
    reveal: () => {
      if (revealed) return;
      setRevealed(true);
      track("shared_result_revealed", { share_type: "agent_result" });
    },
    picker: view.picker,
    ownRoll: view.ownRoll,
    /** Undefined when the link names an agent this version does not know. */
    agent: view.agentKey ? agentByKey.get(view.agentKey) : undefined,
    pool,
    /** True when no agents were selected, so every agent is in play. */
    everyAgent: view.picker.selected.length === 0,
    /** Rolls made here, which is also a key for replaying motion. */
    rolls,
    handleReroll,
    /** Opens the picker with this pool and these roll settings. */
    presetHref: sharePath({ kind: "picker-preset", picker: view.picker }),
    buildResultUrl: () =>
      shareUrl({
        kind: "agent-result",
        picker: view.picker,
        result: { agentKey: view.agentKey },
      }),
  };
}

export type SharedAgent = ReturnType<typeof useSharedAgent>;
export type SharedAgentReady = Extract<SharedAgent, { status: "ready" }>;

export const SHARED_AGENT_ERRORS: Record<ShareErrorReason, string> = {
  "unsupported-version":
    "This link was made with a newer version of the site. Refresh the page and open it again.",
  corrupt:
    "This link looks like it was cut off or altered on the way here, so the agent it points at can't be trusted.",
  malformed: "This share link isn't valid.",
};
