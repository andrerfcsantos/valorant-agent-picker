/**
 * Shared, word for word, between the Overwatch Hero Picker and the Valorant
 * Agent Picker. Edit both copies together; per-site facts live in
 * src/lib/legal/site.ts.
 */

/** The facts that differ between the sites. */
export interface LegalSite {
  /** e.g. "Overwatch Hero Picker" */
  name: string;
  /** Canonical origin, no trailing slash. */
  url: string;
  domain: string;
  game: string;
  publisher: string;
  /** The trademark / fan-content notice the game's publisher asks for. */
  publisherNotice: string;
  /** PostHog product analytics, session replay and error tracking. */
  usesPostHog: boolean;
  /** Where Google Analytics loads, completing "Google Analytics runs …". */
  googleAnalyticsNote: string;
  /** The stream overlay and its companion relay (rooms Worker). */
  hasStreamOverlay: boolean;
  styles: {
    heading: string;
    /** Font for running text, where the body font is a display face. */
    body: string;
    /** Link colours, for sites whose global styles don't colour links. */
    link: string;
  };
}

export const OPERATOR = {
  name: "André Santos",
  country: "Portugal",
  email: "support@heropickers.com",
} as const;

/** Bump whenever either document changes, in both repos. */
export const LAST_UPDATED = "8 November 2026";
