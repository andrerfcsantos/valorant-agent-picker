"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENTS, ROLES, getAllAgents } from "@/data/agents";
import { usePresets } from "@/context/PresetContext";
import { sendEvent } from "@/lib/analytics";
import { buildDefaultPresets } from "@/lib/presets/defaults";
import { presetShareUrl } from "@/lib/presets/share";
import { SavedPreset, shortcutForIndex } from "@/lib/presets/types";
import PresetNameField from "./PresetNameField";

interface Breakdown {
  names: string[];
  /** Role counts in the picker's role order, roles the preset skips left out. */
  roles: string[];
}

function describe(preset: SavedPreset): Breakdown {
  const agents = preset.agents
    .map((key) => AGENTS[key])
    .filter((agent) => agent !== undefined);

  return {
    names: agents.map((agent) => agent.name).sort((a, b) => a.localeCompare(b)),
    roles: ROLES.map((role) => ({
      label: role.label,
      count: agents.filter((agent) => agent.role === role.key).length,
    }))
      .filter(({ count }) => count > 0)
      .map(({ label, count }) => `${count} ${label}`),
  };
}

const AGENT_COUNT = getAllAgents().length;

export default function PresetsContent() {
  const router = useRouter();
  const {
    presets,
    appliedId,
    isHydrated,
    applyPreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    movePreset,
    restoreDefaults,
  } = usePresets();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fallback, setFallback] = useState<{ id: string; url: string } | null>(
    null,
  );
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sendEvent("Page", "Visit", "Presets");
  }, []);

  useEffect(
    () => () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    },
    [],
  );

  const missingDefaults = useMemo(() => {
    const present = new Set(presets.map((preset) => preset.id));
    return buildDefaultPresets().filter((preset) => !present.has(preset.id))
      .length;
  }, [presets]);

  const flash = useCallback((message: string) => {
    setStatus(message);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), 1800);
  }, []);

  const copyLink = useCallback(
    async (preset: SavedPreset) => {
      const url = presetShareUrl(preset.agents);
      try {
        await navigator.clipboard.writeText(url);
        setFallback(null);
        flash(`Link to “${preset.name}” copied!`);
      } catch {
        // The clipboard API needs a secure context and permission.
        setFallback({ id: preset.id, url });
      }
    },
    [flash],
  );

  const applyAndPick = useCallback(
    (id: string) => {
      applyPreset(id);
      router.push("/");
    },
    [applyPreset, router],
  );

  return (
    <div className="preset-page">
      <h1>Manage presets</h1>

      <p className="preset-page-intro">
        Presets save a set of agent filters so you can put them back in one
        click. Apply one from the Presets card above the agents on the{" "}
        <Link href="/" prefetch={false}>
          picker
        </Link>
        , or press its number key.
      </p>
      <p className="preset-page-intro">
        To change which agents a preset holds, apply it on the picker, adjust
        the filters there and press <strong>Update</strong>. The order below is
        the order the presets appear in — and the first ten are the ones the
        number keys reach.
      </p>

      <div className="preset-page-actions">
        <Link className="action-button" href="/" prefetch={false}>
          ← Back to the picker
        </Link>
        <button
          className="action-button"
          onClick={restoreDefaults}
          disabled={missingDefaults === 0}
          title={
            missingDefaults === 0
              ? "Every built-in preset is already in your list"
              : `Add back ${missingDefaults} built-in preset${missingDefaults === 1 ? "" : "s"}`
          }
        >
          Restore built-in presets
        </button>
        {status && (
          <span className="preset-status" aria-live="polite">
            {status}
          </span>
        )}
      </div>

      {isHydrated && presets.length === 0 && (
        <p className="preset-empty">
          You have no presets. Save one from the picker, or bring back the
          built-in ones with the button above.
        </p>
      )}

      <ol className="preset-list">
        {presets.map((preset, index) => {
          const shortcut = shortcutForIndex(index);
          const { names, roles } = describe(preset);

          return (
            <li key={preset.id} className="preset-row">
              <div className="preset-row-order">
                <button
                  className="preset-move"
                  onClick={() => movePreset(preset.id, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${preset.name} up`}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="preset-move"
                  onClick={() => movePreset(preset.id, 1)}
                  disabled={index === presets.length - 1}
                  aria-label={`Move ${preset.name} down`}
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              <div className="preset-row-key">
                {shortcut ? (
                  <kbd className="preset-kbd" title="Applies this preset">
                    {shortcut}
                  </kbd>
                ) : (
                  <span className="preset-row-nokey" title="No number key left">
                    —
                  </span>
                )}
              </div>

              <div className="preset-row-main">
                <div className="preset-row-title">
                  {renamingId === preset.id ? (
                    <PresetNameField
                      initialValue={preset.name}
                      label={`Rename ${preset.name}`}
                      onCommit={(name) => {
                        renamePreset(preset.id, name);
                        setRenamingId(null);
                      }}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <h2 className="preset-row-name">{preset.name}</h2>
                  )}
                  {preset.id === appliedId && (
                    <span className="preset-row-applied">Applied</span>
                  )}
                </div>

                <p className="preset-row-meta">
                  {preset.agents.length === 0
                    ? "No agents — the picker falls back to every agent."
                    : `${preset.agents.length} of ${AGENT_COUNT} agents · ${roles.join(" · ")}`}
                </p>

                {names.length > 0 && (
                  <details className="preset-row-agents">
                    <summary>Show agents</summary>
                    <p>{names.join(", ")}</p>
                  </details>
                )}

                {fallback?.id === preset.id && (
                  <input
                    className="share-fallback-input"
                    type="text"
                    readOnly
                    value={fallback.url}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label={`Link to ${preset.name}`}
                  />
                )}
              </div>

              <div className="preset-row-actions">
                <button
                  className="action-button"
                  onClick={() => applyAndPick(preset.id)}
                  title="Apply these filters and go back to the picker"
                >
                  Apply
                </button>
                <button
                  className="action-button"
                  onClick={() => setRenamingId(preset.id)}
                >
                  Rename
                </button>
                <button
                  className="action-button"
                  onClick={() => duplicatePreset(preset.id)}
                >
                  Duplicate
                </button>
                <button
                  className="action-button"
                  onClick={() => copyLink(preset)}
                >
                  Copy link
                </button>
                <button
                  className="action-button preset-delete"
                  onClick={() => deletePreset(preset.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
