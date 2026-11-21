"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { track } from "@/lib/analytics";
import { ROLES, getAllAgents, getAgentsByRole } from "@/data/agents";
import { useAgents } from "@/context/AgentContext";
import { usePresets } from "@/context/PresetContext";
import { useShareLink } from "@/hooks/useShareLink";
import { buildDefaultPresets } from "@/lib/presets/defaults";
import { presetShareUrl } from "@/lib/presets/share";
import { SavedPreset, shortcutForIndex } from "@/lib/presets/types";
import type { Role } from "@/data/agents";
import RoleSpriteIcon from "@/components/RoleSpriteIcon";
import SpriteIcon from "@/components/SpriteIcon";
import PoolEditor from "./PoolEditor";
import TipButton from "./TipButton";
import ui from "./ui.module.css";
import styles from "./PresetManager.module.css";

const ALL_AGENTS = getAllAgents();

const ROLE_GROUPS = ROLES.map((role) => ({
  ...role,
  agents: getAgentsByRole(role.key),
}));

/** Agent keys in roster order, so a preset reads the same however it was built. */
function inRosterOrder(keys: Set<string>): string[] {
  return ALL_AGENTS.filter((agent) => keys.has(agent.key)).map(
    (agent) => agent.key,
  );
}

function agentCount(count: number): string {
  if (count === 0) return "No agents";
  return count === 1 ? "1 agent" : `${count} agents`;
}

/** What presets are, said once wherever the manager is shown. */
export function PresetIntro({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p>
        A preset is a selection of agents saved under a name, in this browser.
        Applying one selects its agents.
      </p>
      <p className={styles.keysNote}>
        On the picker, the number keys 1 to 0 apply the first ten, in the order
        they are listed here.
      </p>
    </div>
  );
}

/**
 * Who a preset holds, at a glance, said the way a player would say it. A role
 * it holds all of is a count. One it holds most of is "all but" the few left
 * out, drawn hollow as they are in the roster. One it holds a few of is those
 * few. So the line stays short however large the preset is, and a large one
 * shows the thing worth knowing about it, which is who is missing.
 */
function Roster({ preset }: { preset: SavedPreset }) {
  const held = new Set(preset.agents);
  const groups = ROLE_GROUPS.map((group) => ({
    ...group,
    members: group.agents.filter((agent) => held.has(agent.key)),
    missing: group.agents.filter((agent) => !held.has(agent.key)),
  })).filter((group) => group.members.length > 0);

  if (groups.length === 0) {
    return <p className={styles.none}>Empty, so rolls use every agent.</p>;
  }

  return (
    <ul className={styles.roster} aria-label={`Agents in ${preset.name}`}>
      {groups.map(({ key, label, agents, members, missing }) => {
        const all = missing.length === 0;
        const most = !all && members.length > agents.length / 2;
        return (
          <li key={key} className={styles.rosterRole}>
            <span className={styles.rosterCount}>
              <RoleSpriteIcon roleKey={key} alt="" className={ui.roleIcon} />
              <span className={ui.vh}>{label}: </span>
              {all ? `All ${agents.length}` : members.length}
              {most && ", all but"}
            </span>
            {!all &&
              (most ? missing : members).map((agent) => (
                <span
                  key={agent.key}
                  className={`${styles.face} ${most ? styles.faceOut : ""}`}
                  title={agent.name}
                >
                  <SpriteIcon
                    agentKey={agent.key}
                    type="icon"
                    alt={agent.name}
                    className={styles.faceImage}
                  />
                </span>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

interface PresetNameProps {
  preset: SavedPreset;
  position: number;
  onRename: (name: string) => void;
}

/**
 * The name is its own text field, so renaming needs no mode: point at it and
 * type. Enter or leaving the field saves, Escape puts the old name back, and
 * an empty name is never saved.
 *
 * It reads as a heading until it is pointed at, so a pencil at the end of
 * the name says it can be changed. The pencil is part of the field: pressing
 * it selects the name, ready to be typed over.
 */
function PresetName({ preset, position, onRename }: PresetNameProps) {
  const [draft, setDraft] = useState(preset.name);
  const [saved, setSaved] = useState(preset.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // A name changed from outside the field, as an undo does, replaces what
  // the field shows. Otherwise leaving the field would save the old name
  // back over it.
  if (preset.name !== saved) {
    setSaved(preset.name);
    setDraft(preset.name);
  }

  const commit = () => {
    const name = draft.trim();
    if (!name) {
      setDraft(preset.name);
      return;
    }
    setDraft(name);
    if (name !== preset.name) onRename(name);
  };

  return (
    // The label makes the pencil and the space around the name part of the
    // field: a press anywhere in it lands in the name.
    <label className={styles.nameBox}>
      <input
        ref={inputRef}
        className={styles.name}
        type="text"
        data-control="name"
        value={draft}
        // As wide as the name, so the pencil sits at its end. Browsers that
        // size a field to its text do that exactly; this is for the rest.
        size={Math.max(draft.length, 3)}
        aria-label={`Name of preset ${position}`}
        // A browser's saved text is other fields' answers, not preset names.
        autoComplete="off"
        spellCheck={false}
        maxLength={60}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Keys that finish or cancel a word being composed with an input
          // method are the method's, not the field's.
          if (e.nativeEvent.isComposing) return;
          // Saves and stays put: blurring here would drop focus to the page.
          if (e.key === "Enter") commit();
          // Only while there is something to take back. Otherwise Escape is
          // left alone, and closes the sheet the field may be in.
          if (e.key === "Escape" && draft !== preset.name) {
            e.preventDefault();
            setDraft(preset.name);
          }
        }}
      />
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the field itself is what the keyboard reaches; this only selects its text for a pointer */}
      <span
        className={styles.pencil}
        onClick={() => inputRef.current?.select()}
      >
        <PencilIcon />
      </span>
    </label>
  );
}

const NEWEST = Symbol("newest preset");

/** A control inside a preset's row, as the manager asks for it to be focused. */
type Control = "up" | "down" | "name" | "apply" | "edit";

interface PresetRowProps {
  preset: SavedPreset;
  index: number;
  /** How many presets there are, which is where the list ends. */
  listLength: number;
  applied: boolean;
  /** Applied, and the selection still matches it. */
  following: boolean;
  open: boolean;
  /** The picker's selection, offered to a preset with nobody in it yet. */
  selectedKeys: string[];
  rowRef: (node: HTMLLIElement | null) => void;
  onMove: (offset: number) => void;
  onRename: (name: string) => void;
  onApply: () => void;
  onToggleOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetAgents: (keys: Set<string>) => void;
  /** Says what an action did, for anyone who cannot see it happen. */
  announce: (message: string) => void;
}

/**
 * One preset. Everything done to it is on its row: its place in the list at
 * the left, its name to type over, applying it and changing its agents
 * beside that, and the rest (duplicate, copy a link, delete) as a row of
 * icons, each saying what it is when pointed at. Nothing waits behind a
 * menu. A press anywhere else on the row opens its agents too, so the whole
 * card is the way in, not only the button.
 */
function PresetRow({
  preset,
  index,
  listLength,
  applied,
  following,
  open,
  selectedKeys,
  rowRef,
  onMove,
  onRename,
  onApply,
  onToggleOpen,
  onDuplicate,
  onDelete,
  onSetAgents,
  announce,
}: PresetRowProps) {
  const panelId = useId();
  const { copied, fallbackUrl, copy } = useShareLink({
    buildUrl: () => presetShareUrl(preset.agents),
    shareType: "preset",
    shareSource: "manage_page",
  });
  const panelRef = useRef<HTMLDivElement>(null);

  // Each of these links goes away once it has done its job, as "Add
  // everyone" does when everyone is in. Focus moves to the link that undoes
  // it, which is always there afterwards, rather than falling to the page.
  const bulk = (keys: Set<string>, then: "add" | "clear") => {
    onSetAgents(keys);
    requestAnimationFrame(() =>
      panelRef.current
        ?.querySelector<HTMLElement>(`[data-bulk="${then}"]`)
        ?.focus(),
    );
  };

  const shortcut = shortcutForIndex(index);
  const count = preset.agents.length;
  const total = ALL_AGENTS.length;

  const toggleAgent = (agentKey: string) => {
    const next = new Set(preset.agents);
    if (next.has(agentKey)) next.delete(agentKey);
    else next.add(agentKey);
    onSetAgents(next);
  };

  const setRole = (role: Role, inPreset: boolean) => {
    const next = new Set(preset.agents);
    for (const agent of ALL_AGENTS) {
      if (agent.role !== role) continue;
      if (inPreset) next.add(agent.key);
      else next.delete(agent.key);
    }
    onSetAgents(next);
  };

  const onlyRole = (role: Role) => {
    onSetAgents(
      new Set(
        ALL_AGENTS.filter((agent) => agent.role === role).map(
          (agent) => agent.key,
        ),
      ),
    );
  };

  // Worth offering only where it differs from the two links beside it:
  // an empty selection is "clear", and a full one is "add everyone".
  const canCopySelection =
    count === 0 && selectedKeys.length > 0 && selectedKeys.length < total;

  return (
    <li
      ref={rowRef}
      className={`${styles.slot} ${applied ? styles.applied : ""}`}
    >
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a pointer's shortcut to "Edit agents", which is the control the keyboard and screen readers use */}
      <div
        className={styles.row}
        onClick={(event) => {
          // A press on a control in the row is for that control.
          if ((event.target as HTMLElement).closest("button, label, input")) {
            return;
          }
          onToggleOpen();
        }}
      >
        <div className={styles.order}>
          <button
            type="button"
            className={styles.move}
            data-control="up"
            disabled={index === 0}
            aria-label={`Move ${preset.name} up`}
            title="Move up"
            onClick={() => onMove(-1)}
          >
            <Chevron up />
          </button>
          {shortcut && (
            <kbd
              className={styles.key}
              title={`Press ${shortcut} on the picker to apply`}
            >
              {shortcut}
            </kbd>
          )}
          <button
            type="button"
            className={styles.move}
            data-control="down"
            disabled={index === listLength - 1}
            aria-label={`Move ${preset.name} down`}
            title="Move down"
            onClick={() => onMove(1)}
          >
            <Chevron />
          </button>
        </div>

        <div className={styles.main}>
          <div className={styles.top}>
            <PresetName
              preset={preset}
              position={index + 1}
              onRename={onRename}
            />
            <span className={styles.count}>{agentCount(count)}</span>
            <div className={styles.actions}>
              {following ? (
                <span className={styles.state}>
                  <CheckIcon />
                  Applied
                </span>
              ) : (
                <button
                  type="button"
                  className={ui.btn}
                  data-control="apply"
                  aria-label={`${applied ? "Reapply" : "Apply"} ${preset.name}`}
                  title={
                    applied
                      ? "The selection has changed since this preset was applied. Select its agents again."
                      : "Select this preset's agents"
                  }
                  onClick={onApply}
                >
                  {applied ? "Reapply" : "Apply"}
                </button>
              )}
              <button
                type="button"
                className={`${ui.btn} ${ui.caret}`}
                data-control="edit"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={`Edit agents in ${preset.name}`}
                onClick={onToggleOpen}
              >
                Edit agents
              </button>
            </div>
          </div>

          <div className={styles.bottom}>
            <Roster preset={preset} />
            <div className={styles.quick}>
              <IconAction
                label="Duplicate"
                name={`Duplicate ${preset.name}`}
                onClick={onDuplicate}
              >
                <CopyIcon />
              </IconAction>
              <IconAction
                label={copied ? "Link copied" : "Copy link"}
                name={`Copy a link to ${preset.name}`}
                onClick={async () => {
                  const done = await copy();
                  announce(
                    done
                      ? `Copied a link to ${preset.name}.`
                      : `Could not copy. The link to ${preset.name} is shown instead.`,
                  );
                }}
              >
                {copied ? <CheckIcon /> : <LinkIcon />}
              </IconAction>
              <IconAction
                label="Delete"
                name={`Delete ${preset.name}`}
                danger
                onClick={onDelete}
              >
                <TrashIcon />
              </IconAction>
            </div>
          </div>

          {fallbackUrl && (
            <input
              className={`share-fallback-input ${styles.fallback}`}
              type="text"
              readOnly
              value={fallbackUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Link to ${preset.name}`}
            />
          )}
        </div>
      </div>

      {open && (
        <div id={panelId} ref={panelRef} className={styles.panel}>
          <div className={styles.panelHead}>
            <span>
              {count === 0
                ? "Nobody is in this preset yet. Choose its agents below."
                : count === total
                  ? `All ${total} agents are in this preset.`
                  : `${count} of ${total} agents are in this preset.`}
              {following && " The picker's selection follows your changes."}
            </span>
            {count < total && (
              <button
                type="button"
                className={ui.link}
                data-bulk="add"
                onClick={() =>
                  bulk(new Set(ALL_AGENTS.map((agent) => agent.key)), "clear")
                }
              >
                Add everyone
              </button>
            )}
            {canCopySelection && (
              <button
                type="button"
                className={ui.link}
                onClick={() => bulk(new Set(selectedKeys), "clear")}
              >
                Copy the picker&rsquo;s selection (
                {agentCount(selectedKeys.length)})
              </button>
            )}
            {count > 0 && (
              <button
                type="button"
                className={ui.link}
                data-bulk="clear"
                onClick={() => bulk(new Set(), "add")}
              >
                Clear the preset
              </button>
            )}
          </div>

          <PoolEditor
            compact
            label={preset.name}
            isIn={(agentKey) => preset.agents.includes(agentKey)}
            onToggleAgent={toggleAgent}
            onSetRole={setRole}
            onOnlyRole={onlyRole}
          />

          {/* The button that opened this is a long scroll back up by now. */}
          <div className={styles.panelFoot}>
            <button type="button" className={ui.btn} onClick={onToggleOpen}>
              Done
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

interface IconActionProps {
  /** What the icon does, in a word or two, shown when it is pointed at. */
  label: string;
  /** The same, with the preset's name, for anyone not looking at the row. */
  name: string;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function IconAction({
  label,
  name,
  danger = false,
  onClick,
  children,
}: IconActionProps) {
  return (
    <TipButton
      className={`${styles.iconAction} ${danger ? styles.danger : ""}`}
      aria-label={name}
      tip={label}
      tipIsName
      onClick={onClick}
    >
      {children}
    </TipButton>
  );
}

interface PresetManagerProps {
  /** Runs after a preset is applied, to go and look at the pool it set. */
  onApplied?: () => void;
}

/**
 * Everything done to presets as a list: starting a new one, reordering,
 * renaming, changing who is in them, copying, sharing and deleting. The list
 * is the overview; a preset opens in place to choose its agents, on the same
 * roster the picker uses.
 *
 * Shown in a sheet over the picker, and as the /presets page.
 */
export default function PresetManager({ onApplied }: PresetManagerProps) {
  const { selectedAgents } = useAgents();
  const {
    presets,
    appliedId,
    isDirty,
    isHydrated,
    applyPreset,
    createPreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    lastDeleted: deleted,
    undoDelete: undoDeleted,
    setPresetAgents,
    movePreset,
    restoreDefaults,
  } = usePresets();

  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const rows = useRef(new Map<string, HTMLLIElement>());
  const undoRef = useRef<HTMLButtonElement>(null);
  // Set by a delete made here, so the way to undo it takes focus. A delete
  // left over from before the sheet was last closed does not take it.
  const focusUndo = useRef(false);
  // Where focus goes once the list has caught up with what was asked of it.
  // NEWEST stands for a preset that is about to exist and has no id yet.
  const focusNext = useRef<{
    id: string | typeof NEWEST;
    control: Control;
    /** Also brings the row to the top of the view, for one made far below. */
    reveal?: boolean;
  } | null>(null);
  const knownIds = useRef(new Set<string>());
  const lastTops = useRef(new Map<string, number>());
  const lastOrder = useRef("");
  // Presets whose agents were changed here, so each is reported once.
  const edited = useRef(new Set<string>());

  const missingDefaults = useMemo(() => {
    const present = new Set(presets.map((preset) => preset.id));
    return buildDefaultPresets()
      .filter((preset) => !present.has(preset.id))
      .map((preset) => preset.id);
  }, [presets]);

  const selectedKeys = useMemo(
    () => inRosterOrder(selectedAgents),
    [selectedAgents],
  );

  // Rows slide to their new place, so a move, a delete and an undo each show
  // what they did to the order. Measured on every render to have the layout
  // from just before a change, and played only when the order itself changed:
  // a preset opening pushes the rows under it down, and that needs no help.
  useLayoutEffect(() => {
    const order = presets.map((preset) => preset.id).join("\n");
    const moved = lastOrder.current !== "" && lastOrder.current !== order;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tops = new Map<string, number>();
    for (const [id, row] of rows.current) {
      tops.set(id, row.offsetTop);
      const before = lastTops.current.get(id);
      if (!moved || still || before === undefined) continue;
      // The row about to take focus goes straight to its place, so the
      // browser scrolls to where it ends up rather than to where it starts
      // sliding from.
      if (focusNext.current?.id === id) continue;
      const delta = before - row.offsetTop;
      if (delta !== 0) {
        row.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "none" }],
          { duration: 200, easing: "ease-out" },
        );
      }
    }
    lastTops.current = tops;
    lastOrder.current = order;
  });

  useEffect(() => {
    const target = focusNext.current;
    if (target) {
      const id =
        target.id === NEWEST
          ? presets.find((preset) => !knownIds.current.has(preset.id))?.id
          : target.id;
      const row = id ? rows.current.get(id) : undefined;
      if (row) {
        focusNext.current = null;
        // A preset moved to an end of the list has that arrow switched off,
        // so focus takes the other one rather than being dropped.
        const control =
          row.querySelector<HTMLElement>(
            `[data-control="${target.control}"]:not(:disabled)`,
          ) ?? row.querySelector<HTMLElement>("[data-control]:not(:disabled)");
        control?.focus({ preventScroll: target.reveal });
        if (control instanceof HTMLInputElement) control.select();
        if (target.reveal) {
          const still = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          row.scrollIntoView({
            block: "start",
            behavior: still ? "auto" : "smooth",
          });
        } else {
          // A control that kept focus through a move is not scrolled to by
          // focusing it again, and a move past an open preset can take it
          // far off the screen.
          control?.scrollIntoView({ block: "nearest" });
        }
      }
    }
    knownIds.current = new Set(presets.map((preset) => preset.id));
  }, [presets]);

  // The row that held focus is gone; the way to bring it back takes over.
  useEffect(() => {
    if (!deleted || !focusUndo.current) return;
    focusUndo.current = false;
    undoRef.current?.focus();
  }, [deleted]);

  if (!isHydrated) return null;

  const createNew = () => {
    const taken = new Set(presets.map((preset) => preset.name));
    let name = "New preset";
    for (let n = 2; taken.has(name); n += 1) name = `New preset ${n}`;
    const id = createPreset(name);
    // It opens ready for both things a new preset needs: its name is
    // selected to type over, and its agents are below to choose.
    focusNext.current = { id, control: "name", reveal: true };
    setOpenId(id);
    setStatus(
      "New preset added at the end of the list. Name it, then choose its agents.",
    );
  };

  const move = (preset: SavedPreset, index: number, offset: number) => {
    focusNext.current = { id: preset.id, control: offset < 0 ? "up" : "down" };
    movePreset(preset.id, offset);
    setStatus(
      `${preset.name} moved to position ${index + offset + 1} of ${presets.length}.`,
    );
  };

  const apply = (preset: SavedPreset) => {
    applyPreset(preset.id, "manage_page");
    setStatus(`${preset.name} applied.`);
    onApplied?.();
  };

  const duplicate = (preset: SavedPreset) => {
    focusNext.current = { id: NEWEST, control: "name" };
    setOpenId(null);
    duplicatePreset(preset.id);
    setStatus(`${preset.name} duplicated. Name the copy.`);
  };

  const remove = (preset: SavedPreset) => {
    focusUndo.current = true;
    if (openId === preset.id) setOpenId(null);
    deletePreset(preset.id);
    setStatus(`${preset.name} deleted.`);
  };

  const undoDelete = () => {
    if (!deleted) return;
    focusNext.current = { id: deleted.preset.id, control: "edit" };
    undoDeleted();
    setStatus(`${deleted.preset.name} is back.`);
  };

  // A built-in deleted just now comes back the way it was when it was
  // deleted, in its place, as "Undo" would bring it; any others come back
  // as stock, at the end of the list. That is the provider's doing, so it
  // holds for the classic design's restore too.
  const restoreBuiltIns = () => {
    const undone =
      deleted && missingDefaults.includes(deleted.preset.id) ? deleted : null;
    const stock = missingDefaults.filter((id) => id !== undone?.preset.id);
    restoreDefaults();
    // The button goes once nothing is left to restore, so focus goes to a
    // preset it brought back.
    const first = undone?.preset.id ?? stock[0];
    if (first) focusNext.current = { id: first, control: "edit" };
    const atEnd =
      stock.length === 0
        ? ""
        : stock.length === 1
          ? "1 built-in preset is back, at the end of the list."
          : `${stock.length} built-in presets are back, at the end of the list.`;
    setStatus(
      [undone && `${undone.preset.name} is back.`, atEnd]
        .filter(Boolean)
        .join(" "),
    );
  };

  const setAgents = (preset: SavedPreset, keys: Set<string>) => {
    if (!edited.current.has(preset.id)) {
      edited.current.add(preset.id);
      track("preset_managed", { action: "agents_edited" });
    }
    setPresetAgents(preset.id, inRosterOrder(keys));
  };

  const toggleOpen = (preset: SavedPreset) => {
    const closing = openId === preset.id;
    setOpenId(closing ? null : preset.id);
    // "Done" is at the foot of the roster and goes with it, so focus returns
    // to the button that opens it again.
    if (closing) {
      rows.current
        .get(preset.id)
        ?.querySelector<HTMLElement>('[data-control="edit"]')
        ?.focus();
    }
  };

  const undoNotice = deleted && (
    <li key="deleted" className={styles.gone}>
      <span>“{deleted.preset.name}” was deleted.</span>
      <button
        ref={undoRef}
        type="button"
        className={ui.link}
        aria-label={`Undo deleting ${deleted.preset.name}`}
        onClick={undoDelete}
      >
        Undo
      </button>
    </li>
  );

  return (
    <div className={styles.manager}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${ui.btn} ${ui.primary}`}
          onClick={createNew}
        >
          <PlusIcon />
          New preset
        </button>
      </div>

      {presets.length === 0 && !deleted && (
        <p className={styles.empty}>
          Start one here with “New preset”, or select agents on the picker and
          save them from there.
        </p>
      )}

      <ol className={styles.list}>
        {deleted?.afterId === null && undoNotice}
        {presets.flatMap((preset, index) => {
          const applied = preset.id === appliedId;
          const row = (
            <PresetRow
              key={preset.id}
              preset={preset}
              index={index}
              listLength={presets.length}
              applied={applied}
              following={applied && !isDirty}
              open={preset.id === openId}
              selectedKeys={selectedKeys}
              rowRef={(node) => {
                if (node) rows.current.set(preset.id, node);
                else rows.current.delete(preset.id);
              }}
              onMove={(offset) => move(preset, index, offset)}
              onRename={(name) => renamePreset(preset.id, name)}
              onApply={() => apply(preset)}
              onToggleOpen={() => toggleOpen(preset)}
              onDuplicate={() => duplicate(preset)}
              onDelete={() => remove(preset)}
              onSetAgents={(keys) => setAgents(preset, keys)}
              announce={setStatus}
            />
          );

          return deleted?.afterId === preset.id ? [row, undoNotice] : [row];
        })}
      </ol>

      {missingDefaults.length > 0 && (
        <div className={styles.tools}>
          <button type="button" className={ui.link} onClick={restoreBuiltIns}>
            {missingDefaults.length === 1
              ? "Restore the built-in preset you deleted"
              : `Restore the ${missingDefaults.length} built-in presets you deleted`}
          </button>
        </div>
      )}

      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- says what each change did, not the result of a form */}
      <p className={ui.vh} role="status">
        {status}
      </p>
    </div>
  );
}

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d={up ? "M3 10.5l5-5 5 5" : "M3 5.5l5 5 5-5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The icons are drawn alike: 16 units square, one line weight, no fill. */
function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return <Icon d="M8 3v10M3 8h10" />;
}

function CheckIcon() {
  return <Icon d="M3 8.5l3.25 3.25L13 5" />;
}

function PencilIcon() {
  return (
    <Icon d="M2.5 13.5l.7-3.1 7.6-7.6a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2l-7.6 7.6zM9.6 4l2.4 2.4" />
  );
}

function CopyIcon() {
  return (
    <Icon d="M6.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM3.5 10.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1" />
  );
}

function LinkIcon() {
  return (
    <Icon d="M6.9 9.1a3 3 0 0 0 4.25 0l2.1-2.1a3 3 0 0 0-4.25-4.25l-.9.9M9.1 6.9a3 3 0 0 0-4.25 0l-2.1 2.1A3 3 0 0 0 7 13.25l.9-.9" />
  );
}

function TrashIcon() {
  return (
    <Icon d="M2.75 4.25h10.5M6.25 4.25V3a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v1.25M4 4.25l.6 8.35a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.35M6.75 7v3.75M9.25 7v3.75" />
  );
}
