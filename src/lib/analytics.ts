/**
 * The only module that talks to PostHog.
 *
 * Components call {@link track} with an event from {@link EventMap}, so the
 * whole schema lives here and a typo or a stray property is a compile error.
 * Before init (or when the env vars are absent) every call is a silent no-op.
 *
 * The slim build halves the SDK's share of first-load JS, but it ships an empty
 * extension registry — anything not listed in `__extensionClasses` below is
 * simply never constructed, silently. Each bundle here is a loader stub; the
 * heavy payload (rrweb and friends) still arrives lazily from `api_host`.
 */
import posthog, { type CaptureResult } from "posthog-js/dist/module.slim";
import {
  AnalyticsExtensions,
  ErrorTrackingExtensions,
  SessionReplayExtensions,
} from "posthog-js/dist/extension-bundles";
import type { Role } from "@/data/agents";
import { type Design, type DesignChoice, readDesignChoice } from "@/lib/design";
import { DEFAULT_PRESET_ID_PREFIX } from "@/lib/presets/defaults";
import { SHARE_PARAM } from "@/lib/share/urls";

/** One value per share surface, so the funnel can tell them apart. */
export type ShareType =
  | "agent_result"
  | "picker_preset"
  | "squad_result"
  | "squad_preset"
  | "preset";

export type ShareSource =
  | "picker"
  | "squad"
  | "shared_agent"
  | "shared_squad"
  | "preset_bar"
  | "manage_page";

export type PresetKind = "builtin" | "custom";

/** Where a preset was applied from. */
export type PresetApplySource = "chip" | "keyboard" | "manage_page";

/**
 * How the design on an event came about: the build's default, or the
 * visitor's own switch.
 */
export type DesignOrigin = "default" | "chosen";

/** Which control a visitor used to change design. */
export type DesignSwitchSource = "classic_notice" | "nav";

interface AgentPoolProps {
  pool_size: number;
  /** Every key in the pool, so exclusions are queryable per agent. */
  pool_agent_keys: string[];
  pool_controller: number;
  pool_duelist: number;
  pool_initiator: number;
  pool_sentinel: number;
}

/** The full pool composition, attached to each roll instead of per-toggle events. */
export function agentPoolProps(
  pool: readonly { key: string; role: Role }[],
): AgentPoolProps {
  const count = (role: Role) =>
    pool.filter((agent) => agent.role === role).length;
  return {
    pool_size: pool.length,
    pool_agent_keys: pool.map((agent) => agent.key),
    pool_controller: count("CONTROLLER"),
    pool_duelist: count("DUELIST"),
    pool_initiator: count("INITIATOR"),
    pool_sentinel: count("SENTINEL"),
  };
}

export function presetKind(id: string): PresetKind {
  return id.startsWith(DEFAULT_PRESET_ID_PREFIX) ? "builtin" : "custom";
}

/** Built-in ids are safe to log; custom names are the visitor's own words. */
export function builtinId(id: string): string | undefined {
  return id.startsWith(DEFAULT_PRESET_ID_PREFIX)
    ? id.slice(DEFAULT_PRESET_ID_PREFIX.length)
    : undefined;
}

type EventMap = {
  agent_randomized: {
    source: "picker" | "shared_result";
    agent_key: string;
    agent_role: Role;
    non_repeating: boolean;
  } & AgentPoolProps;
  squad_randomized: {
    source: "generator" | "shared_result";
    squad_size: number;
    filtered_slot_count: number;
  };
  squad_slot_rerolled: {
    source: "generator" | "shared_result";
    squad_size: number;
    slot_index: number;
  };
  squad_size_changed: { squad_size: number };
  squad_copied_as_text: { squad_size: number };
  squad_slot_filters_changed: {
    action: "edit" | "reset" | "reset_all";
    /** Null when every slot was reset at once. */
    slot_index: number | null;
    disabled_count: number;
  };
  agent_filters_changed: {
    action:
      | "select_all"
      | "unselect_all"
      | "select_role"
      | "unselect_role"
      | "select_only_role";
    role?: Role;
  };
  picker_option_changed: {
    option: "show_portrait" | "non_repeating";
    enabled: boolean;
  };
  share_link_copied: {
    share_type: ShareType;
    source: ShareSource;
    /** "fallback" means the clipboard failed and the link was shown instead. */
    method: "clipboard" | "fallback";
  };
  shared_link_opened: {
    share_type: ShareType | "unknown";
    valid: boolean;
    invalid_reason?: string;
  };
  shared_preset_undone: { share_type: "picker_preset" | "squad_preset" };
  shared_preset_dismissed: { share_type: "picker_preset" | "squad_preset" };
  preset_applied: {
    preset_kind: PresetKind;
    /** Stable id for built-ins; custom names stay private. */
    builtin_id?: string;
    agent_count: number;
    source: PresetApplySource;
  };
  preset_created: {
    agent_count: number;
    /** Saved from the agents selected, or started empty in the manager. */
    source: "selection" | "blank";
  };
  preset_updated: { preset_kind: PresetKind; agent_count: number };
  preset_deleted: { preset_kind: PresetKind };
  preset_managed: {
    action:
      | "renamed"
      | "duplicated"
      | "moved"
      | "reverted"
      | "unselected"
      | "restored_defaults"
      | "agents_edited"
      | "delete_undone";
  };
  keyboard_shortcut_used: { key: string };
  /**
   * A visitor moved between the classic and the new design. Every event also
   * carries the `design` it happened under (see {@link registerDesign}), so
   * this one is for the moment of switching: who tries the new design, from
   * which control, and who goes back.
   */
  design_switched: {
    from: Design;
    to: Design;
    source: DesignSwitchSource;
  };
  /** The notice that the classic design is going away was closed. */
  design_classic_notice_dismissed: Record<string, never>;
  /**
   * A design banner's feedback link led to Discord. The registered `design`
   * and `design_origin` tell which banner it was: the classic design's
   * notice, or the new design's for those who chose it or got it by default.
   */
  design_feedback_clicked: Record<string, never>;
  /** The banner asking for feedback on the new design was closed. */
  design_feedback_dismissed: Record<string, never>;
  /** Someone opened a shared roll and asked to see what it was. */
  shared_result_revealed: { share_type: "agent_result" | "squad_result" };
};

let initialized = false;

/**
 * Events fired so often that sending each one would dominate the event quota,
 * mapped to "send one in this many". Rolling is the site's core loop: users
 * re-roll dozens to thousands of times per visit. Role buttons get clicked in
 * bursts, and every roll already carries the whole pool. Most shortcuts are
 * `r`, which is a roll. Keep these in step with the Overwatch Hero Picker: the
 * two sites share one event quota.
 */
const SAMPLE_EVERY: Partial<Record<keyof EventMap, number>> = {
  agent_randomized: 20,
  agent_filters_changed: 10,
  keyboard_shortcut_used: 10,
};

/** Added to every event listed in {@link SAMPLE_EVERY}. */
export interface SampleProps {
  /**
   * How many occurrences this event stands for: 1 for a page's first, which
   * is always sent, and the sampling interval for the rest. Sum it, rather
   * than counting events, to estimate the true total; the estimate is
   * unbiased overall and within any breakdown, such as per agent.
   */
  sample_weight: number;
  /** Which occurrence this is since the page loaded, counting unsent ones. */
  page_occurrence: number;
}

/**
 * Keeps the first occurrence, so "did this visit roll at all" stays exact,
 * then each later one independently with probability 1/`every`.
 *
 * Random rather than every n-th on purpose. A fixed stride would hand each
 * kept event the weight of the rolls before it, crediting them to whatever
 * agent and pool the kept roll happened to have, and would drop the rolls
 * after a page's last kept one: a visit of 8 rolls would count as 1. Here
 * every kept event stands only for rolls like itself.
 */
export function createSampler(
  every: number,
  random: () => number = Math.random,
): () => SampleProps | null {
  let occurrences = 0;
  return () => {
    occurrences += 1;
    if (occurrences === 1) return { sample_weight: 1, page_occurrence: 1 };
    if (random() * every >= 1) return null;
    return { sample_weight: every, page_occurrence: occurrences };
  };
}

const samplers = new Map<keyof EventMap, () => SampleProps | null>();

function sampleFor(event: keyof EventMap): SampleProps | null | undefined {
  const every = SAMPLE_EVERY[event];
  if (every === undefined) return undefined;
  let sampler = samplers.get(event);
  if (!sampler) {
    sampler = createSampler(every);
    samplers.set(event, sampler);
  }
  return sampler();
}

/**
 * Share payloads travel in the `d` query param as unique blobs, and squad
 * links carry player names. Left alone they would make every share link its
 * own URL in PostHog, fragmenting the pages you most want to compare, and
 * leak those names — so the blob never leaves the browser.
 */
const SECRET_PARAMS = [SHARE_PARAM];
const URL_SECRETS = new RegExp(
  `([?&](?:${SECRET_PARAMS.join("|")})=)[^&#]+`,
  "g",
);

/** A URL with share payloads replaced by a placeholder. */
export function redactUrl(value: string): string {
  return value.replace(URL_SECRETS, "$1REDACTED");
}

/** One entry of a `$exception` event's `$exception_list`. */
type CapturedException = {
  mechanism?: { synthetic?: boolean };
  stacktrace?: { frames?: unknown[] };
};

/**
 * An extension or injected script that throws reaches `window.onerror` as a
 * bare message string. PostHog wraps it as a synthetic `$exception` with no
 * stack frames, so there is no source file to symbolicate and nothing that
 * ties it to our code. Drop these; real errors keep their frames and pass
 * through.
 */
export function isStacklessThirdPartyException(event: CaptureResult): boolean {
  if (event.event !== "$exception") return false;
  const list = event.properties?.$exception_list as
    | CapturedException[]
    | undefined;
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.every(
    (exception) =>
      exception?.mechanism?.synthetic === true &&
      !exception?.stacktrace?.frames?.length,
  );
}

/** Event payloads are shallow; anything deeper than this is left as is. */
const MAX_SCRUB_DEPTH = 8;

/**
 * Redacts share payloads from every string in an event's properties, at any
 * depth and inside arrays: exception lists nest the page URL in their frames,
 * and any property could end up holding a link.
 */
export function scrubSecrets(
  container: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): void {
  if (typeof container !== "object" || container === null) return;
  if (depth > MAX_SCRUB_DEPTH || seen.has(container)) return;
  seen.add(container);
  const record = container as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (typeof value === "string") record[key] = redactUrl(value);
    else scrubSecrets(value, depth + 1, seen);
  }
}

export function initAnalytics(projectToken: string, host: string): void {
  posthog.init(projectToken, {
    // Every interaction worth counting already has a typed event, so
    // autocapture would only double them: each "Randomize Agent" click would
    // send both an `$autocapture` and an `agent_randomized`. It also takes
    // `$rageclick` with it, which would fire on the Randomize button, where
    // clicking fast is the point. Session replay records clicks on its own
    // and is unaffected.
    autocapture: false,
    // Web Vitals send nearly two `$web_vitals` events per pageview. Only
    // `web_vitals` is overridden: replay's network timing still follows the
    // project setting.
    capture_performance: { web_vitals: false },
    __extensionClasses: {
      // Session replay, plus the analytics family (heatmaps and the rest).
      // Without these the slim build captures pageviews and manual `capture`
      // calls only.
      ...SessionReplayExtensions,
      ...AnalyticsExtensions,
      // The pair `capture_exceptions` below needs to have any effect.
      ...ErrorTrackingExtensions,
    },
    // `host` may be a first-party proxy, which ad blockers do not recognize;
    // `ui_host` still has to name the real PostHog app so the toolbar and its
    // links resolve.
    api_host: host,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    // Dev events are flagged as internal traffic, but recordings would still
    // count against the replay quota — so don't record localhost sessions.
    disable_session_recording: process.env.NODE_ENV === "development",
    before_send: (event) => {
      if (!event) return null;
      if (isStacklessThirdPartyException(event)) return null;
      scrubSecrets(event.properties);
      scrubSecrets(event.properties?.$set);
      scrubSecrets(event.properties?.$set_once);
      scrubSecrets(event.$set);
      scrubSecrets(event.$set_once);
      return event;
    },
  });
  initialized = true;
  // Registered before the SDK sends its first pageview, so every event of the
  // visit says which design it happened under.
  const { design, origin } = designForChoice(readDesignChoice());
  registerDesign(design, origin);
}

/** The design a page is shown in, and where that came from, for analytics. */
export function designForChoice(choice: DesignChoice): {
  design: Design;
  origin: DesignOrigin;
} {
  return {
    design: choice.design,
    origin: choice.chosen ? "chosen" : "default",
  };
}

/**
 * Stamps `design` and `design_origin` on every event from here on. Adoption
 * of the new design is read off these: the share of visitors, pageviews or
 * rolls with `design = refresh`, and how many of them chose it.
 */
export function registerDesign(design: Design, origin: DesignOrigin): void {
  // Events held back for later belong to the design they happened under, so
  // they go out before it changes.
  designChangeListeners.forEach((flush) => flush());
  if (!initialized) return;
  posthog.register({ design, design_origin: origin });
}

const designChangeListeners = new Set<() => void>();

/**
 * Runs `flush` just before the registered design changes. For code that holds
 * an event back (a debounced edit, say): sent after a switch, it would count
 * under the design the visitor moved to. Returns the unsubscribe.
 */
export function beforeDesignChange(flush: () => void): () => void {
  designChangeListeners.add(flush);
  return () => {
    designChangeListeners.delete(flush);
  };
}

export function track<E extends keyof EventMap>(
  event: E,
  properties: EventMap[E],
): void {
  if (!initialized) return;
  const sample = sampleFor(event);
  if (sample === null) return;
  posthog.capture(event, sample ? { ...properties, ...sample } : properties);
}
