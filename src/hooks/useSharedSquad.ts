"use client";

import { useCallback, useEffect, useState } from "react";
import { useDesign } from "@/context/DesignContext";
import { track } from "@/lib/analytics";
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

type ViewState =
  | { status: "loading" }
  | { status: "invalid"; reason: ShareErrorReason }
  | {
      status: "ready";
      squad: SquadPreset;
      agents: (string | null)[];
      ownRoll: boolean;
    };

/**
 * A shared squad: the agents somebody sent, the setup they came from, and
 * rolling again from it. Both designs' share pages are views of this.
 */
export function useSharedSquad() {
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [rolls, setRolls] = useState(0);
  const [squadRolls, setSquadRolls] = useState(0);
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

    // A link of another kind redirects; the destination reports the open.
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
    track("shared_link_opened", { share_type: "squad_result", valid: true });
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
    setSquadRolls((count) => count + 1);
    track("squad_randomized", {
      source: "shared_result",
      squad_size: squad.size,
      filtered_slot_count: squad.slots
        .slice(0, squad.size)
        .filter((slot) => slot !== null).length,
    });
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
      track("squad_slot_rerolled", {
        source: "shared_result",
        squad_size: squad.size,
        slot_index: index,
      });
    },
    [view, publish],
  );

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
      track("shared_result_revealed", { share_type: "squad_result" });
    },
    squad: view.squad,
    /** Agent keys by slot, null where nobody could be given one. */
    agents: view.agents,
    ownRoll: view.ownRoll,
    rolls,
    /** Rolls of the whole squad only. */
    squadRolls,
    handleReroll,
    handleRerollSlot,
    /** Opens the squad generator with this setup. */
    presetHref: sharePath({ kind: "squad-preset", squad: view.squad }),
    buildResultUrl: () =>
      shareUrl({
        kind: "squad-result",
        squad: view.squad,
        result: { agents: view.agents },
      }),
  };
}

export type SharedSquad = ReturnType<typeof useSharedSquad>;
export type SharedSquadReady = Extract<SharedSquad, { status: "ready" }>;

export const SHARED_SQUAD_ERRORS: Record<ShareErrorReason, string> = {
  "unsupported-version":
    "This link was made with a newer version of the site. Refresh the page and open it again.",
  corrupt:
    "This link looks like it was cut off or altered on the way here, so the squad it points at can't be trusted.",
  malformed: "This share link isn't valid.",
};
