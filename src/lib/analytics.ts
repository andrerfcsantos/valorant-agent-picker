export const GA_MEASUREMENT_ID = "G-9ML8E6VC1X";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number>;

/**
 * Sends a GA4 event. Use snake_case names and parameters. Parameters are
 * visible in DebugView right away, but to use them as dimensions in standard
 * reports they must be registered as custom dimensions in GA4.
 */
export function sendEvent(name: string, params?: EventParams) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}
