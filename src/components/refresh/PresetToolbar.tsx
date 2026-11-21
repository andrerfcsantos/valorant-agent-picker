"use client";

import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AGENTS } from "@/data/agents";
import { useAgents } from "@/context/AgentContext";
import { usePresets } from "@/context/PresetContext";
import { clearPanel, readPanel, writePanel } from "@/lib/panels";
import { type PresetChanges, presetChanges } from "@/lib/presets/changes";
import { shortcutForIndex } from "@/lib/presets/types";
import SpriteIcon from "@/components/SpriteIcon";
import PresetSheet from "./PresetSheet";
import TipButton from "./TipButton";
import ui from "./ui.module.css";
import styles from "./PresetToolbar.module.css";

/**
 * Which preset the selection comes from, and everything done about that from
 * the picker, in a row of its own above the roster.
 *
 * The row is always there and always the same height, and it stays in view
 * while the roster scrolls, so what a click on an agent did to the preset shows
 * wherever in the roster the click was. The preset's name sits at the row's
 * left edge and never moves, with an × to stop using it. Once the selection
 * has moved away from the preset, the rest arrives to its right, into room
 * the row keeps free: saving, reverting, saving as a preset of its own, and
 * last, so that it can grow without moving a button, who was added and
 * removed.
 *
 * The list the name opens is the presets, to pick one, and the way to the
 * manager under them. On a phone the row has no room for "Save as new", so
 * that is offered at the foot of the list as well.
 */
export default function PresetToolbar() {
  const { selectedAgents } = useAgents();
  const {
    presets,
    appliedId,
    isDirty,
    isHydrated,
    applyPreset,
    savePreset,
    updatePreset,
    revert,
    clearApplied,
  } = usePresets();
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  // The preset (or null for none) a new preset is being named from, while
  // one is.
  const [naming, setNaming] = useState<{ from: string | null } | null>(null);
  const [announcement, setAnnouncement] = useState({ text: "", n: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const saveNewRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // The control in the row that last had focus, while it still might.
  const lastFocused = useRef<HTMLElement | null>(null);
  const panelId = useId();

  // Most of the row's buttons are there only while the selection differs
  // from the preset, and the selection can change from anywhere: a number
  // key applies a preset with focus still on the "Revert" it just made
  // pointless. Focus that went away with its control lands on the name,
  // which shows what happened, instead of on the page.
  useLayoutEffect(() => {
    const last = lastFocused.current;
    if (!last || last.isConnected) return;
    lastFocused.current = null;
    const active = document.activeElement;
    if (!active || active === document.body) buttonRef.current?.focus();
  });

  // A link that names the manager opens it, so a copied address brings
  // whoever follows it to the same place.
  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the URL is only read after mount
    if (readPanel(window.location.search) === "presets") setManaging(true);
  }, []);

  useDismiss(open, pickerRef, buttonRef, () => setOpen(false));

  const selected = Array.from(selectedAgents);
  const applied = presets.find((preset) => preset.id === appliedId) ?? null;
  const changed = applied !== null && isDirty;

  // Saving a copy of a preset the selection still matches would only make a
  // twin, so the offer is there without a preset, or once the selection has
  // moved away from it, when it saves those changes as a preset of their own.
  const canSaveNew = !applied || isDirty;

  // A click on an agent can make the selection differ from the preset, or
  // match it again, and bring the buttons for that with it. That is said
  // out loud, as the dot and the buttons show it, except where a button
  // here did it and has said so already.
  const lastState = useRef({ id: appliedId, changed });
  const announced = useRef(false);
  useEffect(() => {
    const last = lastState.current;
    lastState.current = { id: appliedId, changed };
    if (announced.current) {
      announced.current = false;
      return;
    }
    if (!applied || last.id !== appliedId || last.changed === changed) return;
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- says what a change made elsewhere on the page did to the preset
    setAnnouncement((previous) => ({
      text: changed
        ? `The selection now differs from ${applied.name}. Save changes and Revert are in the preset row.`
        : `The selection matches ${applied.name} again.`,
      n: previous.n + 1,
    }));
  }, [applied, appliedId, changed]);

  // The name field stays while its agents change, even back to the preset
  // they came from: the visitor is still choosing them, and what they typed
  // is kept. It goes when a different preset is applied, from the keyboard
  // say, because the name it offered was for the old one.
  if (naming && naming.from !== appliedId) setNaming(null);

  if (!isHydrated) return <div className={styles.dock} />;

  const changes = changed ? presetChanges(applied.agents, selected) : null;

  const announce = (text: string) =>
    setAnnouncement((last) => ({ text, n: last.n + 1 }));

  // The buttons that act go away with what they did, so focus lands on the
  // name, which now shows the result.
  const settle = (message: string) => {
    setOpen(false);
    announce(message);
    buttonRef.current?.focus();
  };

  const save = () => {
    if (!applied) return;
    announced.current = true;
    updatePreset(applied.id);
    settle(`Saved changes to ${applied.name}.`);
  };

  const undo = () => {
    if (!applied) return;
    announced.current = true;
    revert();
    settle(`Reverted to ${applied.name}.`);
  };

  const stop = () => {
    if (!applied) return;
    clearApplied();
    settle(`Stopped using ${applied.name}. The agents are still selected.`);
  };

  const openManager = () => {
    setOpen(false);
    setManaging(true);
    writePanel("presets");
  };

  return (
    <div className={styles.dock}>
      <div
        ref={barRef}
        className={styles.bar}
        data-changed={changed || undefined}
        onFocus={(event) => {
          lastFocused.current = event.target;
        }}
        onBlur={(event) => {
          // Only focus that went somewhere else is let go. Focus that went
          // nowhere may be a control that was just taken out of the page.
          const next = event.relatedTarget;
          if (next && !barRef.current?.contains(next)) {
            lastFocused.current = null;
          }
        }}
      >
        <div
          className={`${styles.picker} ${applied ? styles.split : ""}`}
          ref={pickerRef}
        >
          <button
            ref={buttonRef}
            type="button"
            className={`${ui.btn} ${ui.caret} ${styles.trigger}`}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={
              applied
                ? `Preset: ${applied.name}${changed ? ", changed" : ""}`
                : undefined
            }
            onClick={() => setOpen(!open)}
          >
            {applied ? (
              <>
                <span className={styles.label}>Preset</span>
                <span className={styles.name}>{applied.name}</span>
              </>
            ) : (
              "Presets"
            )}
          </button>

          {applied && (
            <TipButton
              className={`${ui.btn} ${styles.stop}`}
              aria-label={`Stop using ${applied.name}`}
              tip={`Stop using ${applied.name}. The agents stay selected.`}
              onClick={stop}
            >
              <CloseIcon />
            </TipButton>
          )}

          {open && (
            <div id={panelId} className={styles.panel}>
              {presets.length > 0 ? (
                <ul className={styles.list}>
                  {presets.map((preset, index) => {
                    const shortcut = shortcutForIndex(index);
                    return (
                      <li key={preset.id}>
                        <button
                          type="button"
                          className={styles.item}
                          aria-pressed={preset.id === appliedId}
                          onClick={() => {
                            applyPreset(preset.id, "chip");
                            setOpen(false);
                            buttonRef.current?.focus();
                          }}
                        >
                          <span className={styles.itemName}>{preset.name}</span>
                          <span className={styles.itemCount}>
                            {agentCount(preset.agents.length)}
                          </span>
                          {shortcut && (
                            <kbd
                              className={styles.itemKey}
                              title={`Press ${shortcut} to apply`}
                            >
                              {shortcut}
                            </kbd>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.empty}>
                  No presets yet. Select some agents and save them as a preset,
                  or start one from scratch under “Manage presets”.
                </p>
              )}

              {/* The way to the manager is here as well as in the row: a
                  list of presets is where one looks for it. Saving as a new
                  preset is here only where the row has no room for its
                  button. */}
              <div className={styles.foot}>
                {changed && (
                  <button
                    type="button"
                    className={`${ui.link} ${styles.footSaveNew}`}
                    onClick={() => {
                      setOpen(false);
                      setNaming({ from: appliedId });
                    }}
                  >
                    Save as new preset
                  </button>
                )}
                <button
                  type="button"
                  className={ui.link}
                  aria-haspopup="dialog"
                  onClick={openManager}
                >
                  Manage presets
                </button>
              </div>
            </div>
          )}
        </div>

        {changed && (
          <div className={`${styles.pending} ${styles.arrive}`}>
            <TipButton
              className={`${ui.btn} ${styles.action} ${styles.save}`}
              aria-label={`Save changes to ${applied.name}`}
              tip={`Make the ${applied.name} preset these agents`}
              onClick={save}
            >
              <SaveIcon />
              <span className={styles.text}>Save changes</span>
            </TipButton>
            <TipButton
              className={`${ui.btn} ${styles.action}`}
              aria-label="Revert changes"
              tip={`Undo your changes and go back to ${applied.name}`}
              onClick={undo}
            >
              <RevertIcon />
              <span className={styles.text}>Revert</span>
            </TipButton>
          </div>
        )}

        {(naming || canSaveNew) &&
          (naming ? (
            <NewPresetForm
              initialName={
                applied ? `${applied.name} copy` : agentCount(selected.length)
              }
              onSave={(name) => {
                savePreset(name);
                setNaming(null);
                settle(`Saved as ${name}, and applied.`);
              }}
              onCancel={() => {
                setNaming(null);
                // Back to the button that opened the field, once it is back,
                // or to the name where the offer was made from its list.
                requestAnimationFrame(() => {
                  saveNewRef.current?.focus();
                  if (document.activeElement !== saveNewRef.current) {
                    buttonRef.current?.focus();
                  }
                });
              }}
            />
          ) : (
            <TipButton
              ref={saveNewRef}
              className={`${ui.btn} ${styles.action} ${styles.saveNew} ${applied ? styles.arrive : ""}`}
              aria-label={applied ? "Save as new preset" : undefined}
              tip={
                applied
                  ? `Keep ${applied.name} as it is, and save these agents under a new name`
                  : "Save these agents under a name, to select them again in one click"
              }
              onClick={() => setNaming({ from: appliedId })}
            >
              <PlusIcon />
              <span className={applied ? styles.text : undefined}>
                {applied ? "Save as new" : "Save as preset"}
              </span>
            </TipButton>
          ))}

        {changes && !naming && (
          <ChangesTray
            presetName={applied?.name ?? ""}
            changes={changes}
            agentName={(key) => AGENTS[key]?.name ?? key}
          />
        )}

        {!naming && (
          <button
            type="button"
            className={`${ui.link} ${styles.manage}`}
            aria-haspopup="dialog"
            onClick={openManager}
          >
            Manage presets
          </button>
        )}
      </div>

      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- announces what a preset action did */}
      <p className={ui.vh} role="status">
        <span key={announcement.n}>{announcement.text}</span>
      </p>

      <PresetSheet
        open={managing}
        onClose={() => {
          setManaging(false);
          clearPanel("presets");
          // Whatever opened the sheet may be gone, so focus returns to the
          // name, which shows what the sheet left applied.
          buttonRef.current?.focus();
        }}
      />
    </div>
  );
}

function agentCount(count: number): string {
  return count === 1 ? "1 agent" : `${count} agents`;
}

/**
 * Closes a small popover the way popovers are expected to close: a click
 * anywhere outside it, focus moving out of it, or Escape, which hands focus
 * back to its button. Moving focus out closes it so that two popovers in the
 * row are never open at once, each waiting on the same Escape.
 */
function useDismiss(
  open: boolean,
  within: RefObject<HTMLElement | null>,
  button: RefObject<HTMLElement | null>,
  close: () => void,
) {
  const onClose = useEffectEvent(close);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!within.current?.contains(event.target as Node)) onClose();
    }

    function handleFocusIn(event: FocusEvent) {
      if (!within.current?.contains(event.target as Node)) onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onClose();
      button.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, within, button]);
}

/** How many faces each side of the tray shows before its count says the rest. */
const TRAY_FACES = 4;

interface ChangesTrayProps {
  presetName: string;
  changes: PresetChanges;
  agentName: (key: string) => string;
}

/**
 * Who was added to and removed from the applied preset, beside the buttons
 * that save or undo exactly that. Each side is a count and the first few
 * faces, drawn as the roster draws them: in the selection, or left out of it.
 * It comes last in the row, so it grows and shrinks with every click on a
 * agent without moving a button. Pressing it lists everyone by name.
 */
function ChangesTray({ presetName, changes, agentName }: ChangesTrayProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useDismiss(open, wrapRef, buttonRef, () => setOpen(false));

  const { added, removed } = changes;
  const spoken = [
    added.length > 0 && `${added.length} added`,
    removed.length > 0 && `${removed.length} removed`,
  ]
    .filter(Boolean)
    .join(", ");

  const side = (keys: string[], sign: string, out = false) =>
    keys.length > 0 && (
      <span className={`${styles.traySide} ${out ? styles.out : ""}`}>
        <span className={styles.trayCount}>
          {sign}
          {keys.length}
        </span>
        {keys.slice(0, TRAY_FACES).map((key) => (
          <SpriteIcon
            key={key}
            agentKey={key}
            type="icon"
            alt=""
            className={styles.trayFace}
          />
        ))}
      </span>
    );

  const list = (keys: string[], label: string, out = false) =>
    keys.length > 0 && (
      <div className={styles.changeRow}>
        <dt>{label}</dt>
        <dd>
          <ul className={styles.changeAgents}>
            {keys.map((key) => (
              <li
                key={key}
                className={`${styles.changeAgent} ${out ? styles.out : ""}`}
              >
                <SpriteIcon
                  agentKey={key}
                  type="icon"
                  alt=""
                  className={styles.changeIcon}
                />
                {agentName(key)}
              </li>
            ))}
          </ul>
        </dd>
      </div>
    );

  return (
    <div className={`${styles.tray} ${styles.arrive}`} ref={wrapRef}>
      <TipButton
        ref={buttonRef}
        className={styles.trayButton}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Changes to ${presetName}: ${spoken}`}
        tip={`What changed since you applied ${presetName}. Press for names.`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.dot} />
        {side(added, "+")}
        {side(removed, "−", true)}
      </TipButton>

      {open && (
        <div id={panelId} className={`${styles.panel} ${styles.changes}`}>
          <h3 id={`${panelId}-title`} className={styles.changesTitle}>
            Changed since you applied {presetName}
          </h3>
          {/* A stop of its own for the keyboard, since it scrolls once
              many agents have changed and not every browser lets the
              keyboard scroll a box that has nothing in it to focus. */}
          <section
            className={styles.changeScroll}
            aria-labelledby={`${panelId}-title`}
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region needs a tab stop to be scrolled from the keyboard
            tabIndex={0}
          >
            <dl className={styles.changeList}>
              {list(added, "Added")}
              {list(removed, "Removed", true)}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

interface NewPresetFormProps {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

/**
 * Naming a new preset, in the row, where the button that asked for it was.
 * It waits to be saved or cancelled: a click elsewhere is not an answer, so
 * it never makes a preset nobody asked for.
 */
function NewPresetForm({ initialName, onSave, onCancel }: NewPresetFormProps) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = value.trim();

  // The field only ever appears in answer to a click, so taking focus is the
  // point of it rather than a surprise.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      className={styles.naming}
      onSubmit={(event) => {
        event.preventDefault();
        if (name) onSave(name);
      }}
    >
      <input
        ref={inputRef}
        className={styles.nameField}
        type="text"
        value={value}
        aria-label="Name for the new preset"
        // A browser's saved text is other fields' answers, not preset names.
        autoComplete="off"
        spellCheck={false}
        maxLength={60}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // An input method's own Escape cancels the word being composed.
          if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
          // Cancels the naming and nothing else that listens for Escape.
          event.stopPropagation();
          onCancel();
        }}
      />
      <button
        type="submit"
        className={`${ui.btn} ${ui.primary}`}
        disabled={!name}
      >
        Save
      </button>
      <button type="button" className={ui.btn} onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M2.5 3.5a1 1 0 0 1 1-1h7.6l2.4 2.4v7.6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z M5 2.5v3h5v-3 M4.75 13.5V9.5h6.5v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RevertIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M3 6.5h6.5a3.5 3.5 0 0 1 0 7H6 M5.75 3.25 2.75 6.5l3 3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 3.5l9 9m0-9l-9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
