"use client";

import { useRef } from "react";
import { getAllAgents } from "@/data/agents";
import type { Role } from "@/data/agents";
import { track } from "@/lib/analytics";
import { useAgents } from "@/context/AgentContext";
import ShareButton from "@/components/ShareButton";
import { handOffFocus } from "./focus";
import PoolEditor from "./PoolEditor";
import PresetToolbar from "./PresetToolbar";
import ui from "./ui.module.css";
import styles from "./AgentPool.module.css";

const TOTAL = getAllAgents().length;

interface AgentPoolProps {
  /** The agent showing in the result, marked in the roster. */
  currentAgentKey: string | null;
  buildPresetUrl: () => string;
}

/**
 * The picker's agent pool: what is in it, the few things done to it as a
 * whole, the preset it came from, and the roster itself.
 */
export default function AgentPool({
  currentAgentKey,
  buildPresetUrl,
}: AgentPoolProps) {
  const {
    selectedAgents,
    toggleAgent,
    selectByRole,
    unselectByRole,
    selectOnlyRole,
    selectAll,
    unselectAll,
  } = useAgents();

  const count = selectedAgents.size;
  // Each of "Select all" and "Clear selection" goes away once it has done its
  // job, and the other is then always there: focus moves to it.
  const selectAllButton = useRef<HTMLButtonElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);

  const summary =
    count === 0
      ? "None selected, so rolls use every agent."
      : count === TOTAL
        ? `All ${TOTAL} agents are selected.`
        : `${count} of ${TOTAL} agents are selected.`;

  const setRole = (role: Role, inPool: boolean) => {
    if (inPool) selectByRole(role);
    else unselectByRole(role);
    track("agent_filters_changed", {
      action: inPool ? "select_role" : "unselect_role",
      role,
    });
  };

  const onlyRole = (role: Role) => {
    selectOnlyRole(role);
    track("agent_filters_changed", { action: "select_only_role", role });
  };

  return (
    <section className={styles.pool} aria-labelledby="agent-pool-heading">
      <div className={styles.head}>
        <h2 id="agent-pool-heading" className={styles.heading}>
          Agent selection
        </h2>
        <div className={styles.summary}>
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a live count, not the result of a form */}
          <span role="status">{summary}</span>
          {count < TOTAL && (
            <button
              type="button"
              className={ui.link}
              ref={handOffFocus(() => clearButton.current, selectAllButton)}
              onClick={() => {
                selectAll();
                track("agent_filters_changed", { action: "select_all" });
              }}
            >
              Select all
            </button>
          )}
          {count > 0 && (
            <button
              type="button"
              className={ui.link}
              ref={handOffFocus(() => selectAllButton.current, clearButton)}
              onClick={() => {
                unselectAll();
                track("agent_filters_changed", { action: "unselect_all" });
              }}
            >
              Clear selection
            </button>
          )}
        </div>

        <div className={styles.tools}>
          <ShareButton
            className={ui.btn}
            buildUrl={buildPresetUrl}
            shareType="picker_preset"
            shareSource="picker"
            label="Share selection"
            copiedLabel="Selection link copied"
            title="Copy a link that selects these agents, with these roll settings"
          />
        </div>
      </div>

      {/* Between the summary and the roster, in a row nothing else shares:
          what a changed selection adds to it has room to arrive in, and
          neither the title above nor the roster below moves for it. */}
      <PresetToolbar />

      <PoolEditor
        rail
        isIn={(key) => selectedAgents.has(key)}
        onToggleAgent={toggleAgent}
        onSetRole={setRole}
        onOnlyRole={onlyRole}
        currentAgentKey={currentAgentKey}
      />
    </section>
  );
}
