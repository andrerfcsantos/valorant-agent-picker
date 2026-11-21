"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAgentsByRole, getAllAgents } from "@/data/agents";
import type { Agent, Role } from "@/data/agents";
import { useAgents } from "@/context/AgentContext";
import { usePresets } from "@/context/PresetContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { agentPoolProps, track } from "@/lib/analytics";
import {
  loadNonRepeating,
  loadShowPortrait,
  saveNonRepeating,
  saveShowPortrait,
} from "@/lib/localStorage";
import { SHORTCUT_COUNT, shortcutForIndex } from "@/lib/presets/types";
import { PickerPreset } from "@/lib/share/types";
import { shareUrl } from "@/lib/share/urls";

/** The agents a roll picks from: the selection, or every agent if it is empty. */
export function poolFor(selected: Set<string>): Agent[] {
  return selected.size > 0
    ? getAllAgents().filter((a) => selected.has(a.key))
    : getAllAgents();
}

function pickRandom(
  selected: Set<string>,
  previousKey?: string | null,
  nonRepeating?: boolean,
): Agent {
  const pool = poolFor(selected);
  if (nonRepeating && previousKey && pool.length > 1) {
    const filtered = pool.filter((a) => a.key !== previousKey);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

interface PickerOptions {
  showPortrait: boolean;
  nonRepeating: boolean;
}

/**
 * The options a shared preset replaced, kept for the whole visit rather than
 * per mount. The provider holds the shared preset across pages, so leaving
 * the picker and coming back mounts the hook again with the same preset: it
 * must not be applied a second time, or Undo would "restore" the options the
 * link itself set.
 */
let shareSnapshot: { preset: PickerPreset; before: PickerOptions } | null =
  null;

/**
 * Everything the random agent page does, without any of how it looks: the
 * roll, the options, share links, shared-preset undo, and the keyboard
 * shortcuts. The classic and the new design are two views over this one hook,
 * so a behaviour change lands in both.
 *
 * Call it once per page, above the choice of design (see `PickerPage`), and
 * hand the result to whichever view is showing. A second instance would roll
 * its own agent and apply a shared link's options a second time, which is
 * what switching design must not do.
 */
export function usePicker() {
  const {
    selectedAgents,
    isHydrated,
    selectByRole,
    unselectByRole,
    unselectAll,
    sharedPreset,
    sharedPresetApplied,
    undoSharedPreset,
    dismissSharedPreset,
  } = useAgents();
  const { presets, applyPreset } = usePresets();

  const [chosenAgent, setChosenAgent] = useState<Agent | null>(null);
  const [agentCount, setAgentCount] = useState(0);
  const [showPortrait, setShowPortrait] = useState(true);
  const [nonRepeating, setNonRepeating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const optionsBeforeShare = useRef<PickerOptions | null>(null);

  // Options are the picker's own state; the filters live in the provider. This
  // runs before the provider hydrates, so a shared preset still wins below.
  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- saved options are in localStorage, read after mount
    setShowPortrait(loadShowPortrait());
    setNonRepeating(loadNonRepeating());
    setMounted(true);
  }, []);

  // A shared preset carries options as well as filters. The provider publishes
  // the decoded preset; putting the options into effect is the picker's job.
  useEffect(() => {
    if (!sharedPreset) return;
    if (shareSnapshot?.preset === sharedPreset) {
      // Already applied on an earlier visit to this page; storage holds it.
      optionsBeforeShare.current = shareSnapshot.before;
      return;
    }
    // Read from storage rather than state: the values the link replaced are
    // still there, and they are what Undo has to put back.
    optionsBeforeShare.current = {
      showPortrait: loadShowPortrait(),
      nonRepeating: loadNonRepeating(),
    };
    shareSnapshot = {
      preset: sharedPreset,
      before: optionsBeforeShare.current,
    };
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the provider publishes a shared preset after mount
    setShowPortrait(sharedPreset.showPortrait);
    setNonRepeating(sharedPreset.nonRepeating);
    saveShowPortrait(sharedPreset.showPortrait);
    saveNonRepeating(sharedPreset.nonRepeating);
  }, [sharedPreset]);

  // The opening roll, once the filters it should respect are known. Later
  // filter changes leave the agent on screen alone.
  useEffect(() => {
    if (!isHydrated) return;
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the opening roll is random, so it waits for the client
    setChosenAgent((current) => current ?? pickRandom(selectedAgents));
  }, [isHydrated, selectedAgents]);

  const handleRandomAgent = useCallback(() => {
    const agent = pickRandom(selectedAgents, chosenAgent?.key, nonRepeating);
    setChosenAgent(agent);
    setAgentCount((c) => c + 1);
    track("agent_randomized", {
      source: "picker",
      agent_key: agent.key,
      agent_role: agent.role,
      non_repeating: nonRepeating,
      ...agentPoolProps(poolFor(selectedAgents)),
    });
  }, [selectedAgents, chosenAgent, nonRepeating]);

  // Setting an option and the visitor choosing it are different things: the
  // undo path below also restores options, and that must not look like clicks.
  const applyShowPortrait = (checked: boolean) => {
    setShowPortrait(checked);
    saveShowPortrait(checked);
  };

  const applyNonRepeating = (checked: boolean) => {
    setNonRepeating(checked);
    saveNonRepeating(checked);
  };

  const handleShowPortrait = (checked: boolean) => {
    applyShowPortrait(checked);
    track("picker_option_changed", {
      option: "show_portrait",
      enabled: checked,
    });
  };

  const handleNonRepeating = (checked: boolean) => {
    applyNonRepeating(checked);
    track("picker_option_changed", {
      option: "non_repeating",
      enabled: checked,
    });
  };

  const currentPreset = useCallback(
    (): PickerPreset => ({
      selected: Array.from(selectedAgents),
      showPortrait,
      nonRepeating,
    }),
    [selectedAgents, showPortrait, nonRepeating],
  );

  const buildResultUrl = useCallback(
    () =>
      shareUrl({
        kind: "agent-result",
        picker: currentPreset(),
        result: { agentKey: chosenAgent?.key ?? null },
      }),
    [currentPreset, chosenAgent],
  );

  const buildPresetUrl = useCallback(
    () => shareUrl({ kind: "picker-preset", picker: currentPreset() }),
    [currentPreset],
  );

  const handleUndoShared = useCallback(() => {
    const previous = optionsBeforeShare.current;
    if (previous) {
      applyShowPortrait(previous.showPortrait);
      applyNonRepeating(previous.nonRepeating);
    }
    undoSharedPreset();
    track("shared_preset_undone", { share_type: "picker_preset" });
  }, [undoSharedPreset]);

  const handleDismissShared = useCallback(() => {
    dismissSharedPreset();
    track("shared_preset_dismissed", { share_type: "picker_preset" });
  }, [dismissSharedPreset]);

  const toggleRole = useCallback(
    (role: Role) => {
      const allOfRole = getAgentsByRole(role);
      const selectedOfRole = allOfRole.filter((a) => selectedAgents.has(a.key));
      if (selectedOfRole.length === allOfRole.length) {
        unselectByRole(role);
      } else {
        selectByRole(role);
      }
    },
    [selectedAgents, selectByRole, unselectByRole],
  );

  // The first ten presets answer to the number row, in list order. The order is
  // the visitor's to change, on the manage page.
  const presetShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {};
    presets.slice(0, SHORTCUT_COUNT).forEach((preset, index) => {
      const key = shortcutForIndex(index);
      if (key) map[key] = () => applyPreset(preset.id, "keyboard");
    });
    return map;
  }, [presets, applyPreset]);

  useKeyboardShortcuts({
    r: handleRandomAgent,
    s: () => toggleRole("SENTINEL"),
    i: () => toggleRole("INITIATOR"),
    d: () => toggleRole("DUELIST"),
    c: () => toggleRole("CONTROLLER"),
    u: unselectAll,
    ...presetShortcuts,
  });

  return {
    /** False until saved options have been read; render nothing before it. */
    mounted,
    /** False until the saved selection has been read. */
    isHydrated,
    chosenAgent,
    /** Rolls the visitor asked for, which is also a key for replaying motion. */
    agentCount,
    showPortrait,
    nonRepeating,
    handleRandomAgent,
    handleShowPortrait,
    handleNonRepeating,
    buildResultUrl,
    buildPresetUrl,
    sharedPresetApplied,
    handleUndoShared,
    handleDismissShared,
  };
}

export type Picker = ReturnType<typeof usePicker>;
