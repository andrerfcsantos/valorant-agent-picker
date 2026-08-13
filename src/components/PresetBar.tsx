"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAgents } from "@/context/AgentContext";
import { usePresets } from "@/context/PresetContext";
import { getJsonFromLS, setJsonToLS } from "@/lib/localStorage";
import { presetShareUrl } from "@/lib/presets/share";
import { SavedPreset, shortcutForIndex } from "@/lib/presets/types";
import PresetNameField from "./PresetNameField";

/**
 * The preset card: one click applies, and everything else about a preset lives
 * behind its own menu. Changing which agents a preset holds is deliberately not
 * in here — that is the agent grid below, plus Update.
 */
export default function PresetBar() {
  const { selectedAgents } = useAgents();
  const {
    presets,
    appliedId,
    isDirty,
    isHydrated,
    applyPreset,
    savePreset,
    updatePreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    revert,
    clearApplied,
  } = usePresets();

  const [collapsed, setCollapsed] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuAlignEnd, setMenuAlignEnd] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCount = selectedAgents.size;
  const applied = presets.find((preset) => preset.id === appliedId) ?? null;

  useEffect(() => {
    setCollapsed(getJsonFromLS<boolean>("presetsCollapsed") ?? true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    setJsonToLS("presetsCollapsed", next);
  }, [collapsed]);

  useEffect(
    () => () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    },
    [],
  );

  // The menu is a small popover, so it closes the way popovers are expected to.
  useEffect(() => {
    if (!menuId) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".preset-chip")) setMenuId(null);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuId(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuId]);

  // Chips wrap across the card, so a menu opened on a right-hand chip would
  // hang off the page — which `overflow-x: hidden` on the body would clip away
  // rather than scroll to. Measure once on open and flip it to the other edge.
  const measureMenu = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const { right } = node.getBoundingClientRect();
    setMenuAlignEnd(right > window.innerWidth - 8);
  }, []);

  const flash = useCallback((message: string) => {
    setStatus(message);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), 1800);
  }, []);

  const copyLink = useCallback(
    async (preset: SavedPreset) => {
      const url = presetShareUrl(preset.agents);
      setMenuId(null);
      try {
        await navigator.clipboard.writeText(url);
        setFallbackUrl(null);
        flash(`Link to “${preset.name}” copied!`);
      } catch {
        // The clipboard API needs a secure context and permission.
        setFallbackUrl(url);
      }
    },
    [flash],
  );

  if (!isHydrated) return null;

  // The same pair either way: beside the name while collapsed, after the
  // sentence that explains them once the card is open. They travel as one box
  // so a wrap never leaves Revert stranded on a line of its own.
  const dirtyActions =
    applied && isDirty ? (
      <span className="preset-pending-pair">
        <button
          className="preset-pending"
          onClick={() => updatePreset(applied.id)}
          title="Save your changes into the applied preset"
        >
          Update
        </button>
        <button
          className="preset-pending quiet"
          onClick={revert}
          title="Put the filters back to the applied preset"
        >
          Revert
        </button>
      </span>
    ) : null;

  return (
    <div className="preset-bar">
      <div className="preset-bar-head">
        <button
          className="preset-bar-toggle"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          title={collapsed ? "Show presets" : "Hide presets"}
        >
          <span className="preset-bar-caret" aria-hidden="true">
            {collapsed ? "▸" : "▾"}
          </span>
          Presets
        </button>

        {/* Collapsing should not hide which preset the filters came from, nor
            put the two answers to a pending change out of reach. */}
        {collapsed && applied && (
          <span className="preset-bar-summary">
            {applied.name}
            {isDirty && <span className="preset-chip-dot" aria-hidden="true" />}
          </span>
        )}
        {collapsed && dirtyActions}

        {applied && (
          <button
            className="preset-unselect"
            onClick={clearApplied}
            title="Keep these agents, but stop following the preset"
          >
            ✕ Unselect preset
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="preset-bar-body">
          {/* Says what happened before offering the two ways out of it. */}
          {isDirty && applied && (
            <div className="preset-dirty" aria-live="polite">
              <span className="preset-dirty-text">
                You selected the preset{" "}
                <span className="preset-dirty-name">“{applied.name}”</span>,
                then updated the agent selection. Want to update the preset with
                the currently selected agents?
              </span>
              {dirtyActions}
            </div>
          )}

          <div className="preset-chip-row">
            {presets.map((preset, index) => {
              if (renamingId === preset.id) {
                return (
                  <PresetNameField
                    key={preset.id}
                    initialValue={preset.name}
                    label={`Rename ${preset.name}`}
                    onCommit={(name) => {
                      renamePreset(preset.id, name);
                      setRenamingId(null);
                    }}
                    onCancel={() => setRenamingId(null)}
                  />
                );
              }

              const isApplied = preset.id === appliedId;
              const shortcut = shortcutForIndex(index);

              return (
                <span
                  key={preset.id}
                  className={`preset-chip ${isApplied ? "applied" : ""}`}
                >
                  <button
                    className="preset-chip-apply"
                    onClick={() => applyPreset(preset.id)}
                    aria-pressed={isApplied}
                    title={`Apply ${preset.name} (${preset.agents.length} agents)`}
                  >
                    {shortcut && <kbd className="preset-kbd">{shortcut}</kbd>}
                    <span className="preset-chip-name">{preset.name}</span>
                    {isApplied && isDirty && (
                      <span className="preset-chip-dot" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    className="preset-chip-menu"
                    onClick={() =>
                      setMenuId(menuId === preset.id ? null : preset.id)
                    }
                    aria-haspopup="menu"
                    aria-expanded={menuId === preset.id}
                    aria-label={`Actions for ${preset.name}`}
                    title={`Actions for ${preset.name}`}
                  >
                    ⋯
                  </button>

                  {menuId === preset.id && (
                    <div
                      ref={measureMenu}
                      className={`preset-menu ${menuAlignEnd ? "align-end" : ""}`}
                      role="menu"
                    >
                      <button
                        role="menuitem"
                        onClick={() => {
                          setRenamingId(preset.id);
                          setMenuId(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          updatePreset(preset.id);
                          setMenuId(null);
                          flash(
                            `“${preset.name}” now holds your current filters.`,
                          );
                        }}
                      >
                        Update with current filters
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          duplicatePreset(preset.id);
                          setMenuId(null);
                        }}
                      >
                        Duplicate
                      </button>
                      <button role="menuitem" onClick={() => copyLink(preset)}>
                        Copy link
                      </button>
                      <span className="preset-menu-separator" />
                      <button
                        role="menuitem"
                        className="preset-menu-danger"
                        onClick={() => {
                          deletePreset(preset.id);
                          setMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </span>
              );
            })}
          </div>

          <div className="preset-tools">
            {saving ? (
              <PresetNameField
                initialValue={`${selectedCount} agents`}
                label="Name for the new preset"
                onCommit={(name) => {
                  savePreset(name);
                  setSaving(false);
                }}
                onCancel={() => setSaving(false)}
              />
            ) : (
              <button
                className="preset-tool"
                onClick={() => setSaving(true)}
                title="Save the current filters as a new preset"
              >
                ＋ Save current
              </button>
            )}
            <Link className="preset-tool" href="/presets" prefetch={false}>
              ⚙ Manage presets…
            </Link>
          </div>

          {status && (
            <span className="preset-status" aria-live="polite">
              {status}
            </span>
          )}

          {fallbackUrl && (
            <input
              className="share-fallback-input"
              type="text"
              readOnly
              value={fallbackUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Preset link"
            />
          )}
        </div>
      )}
    </div>
  );
}
