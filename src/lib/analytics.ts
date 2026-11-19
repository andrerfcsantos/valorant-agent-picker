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
 *
 * page_location and page_title are taken from the page when the event
 * fires. Until gtag.js loads, events wait in a queue, and GA4 would
 * otherwise attribute them to whatever page is current when the queue is
 * processed. (The title is briefly empty during a route change; GA4 then
 * reads it as usual.)
 */
export function sendEvent(name: string, params?: EventParams) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, {
      page_location: window.location.href,
      ...(document.title ? { page_title: document.title } : {}),
      ...params,
    });
  }
}
