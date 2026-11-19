/**
 * Google Analytics (gtag), kept for page views only. Every interaction is a
 * typed PostHog event sent through `track` in lib/analytics.ts.
 */
import { SHARE_PARAM } from "@/lib/share/urls";

export const GA_MEASUREMENT_ID = "G-9ML8E6VC1X";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number>;

/**
 * A URL as reported to GA4. The share payload is dropped because squad links
 * carry player names, and so is the fragment. Other query parameters (utm_*
 * and the like) are kept. The inline snippet in the root layout applies the
 * same rule to the first page load's URL and referrer.
 */
export function sanitizePageLocation(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(SHARE_PARAM);
  url.hash = "";
  return url.toString();
}

export function currentPageLocation(): string {
  return sanitizePageLocation(window.location.href);
}

/**
 * Sets page_location and page_referrer for every later hit, including gtag's
 * automatic events (user_engagement, scroll, outbound clicks), which would
 * otherwise read the raw URL and the landing page's referrer. Call it
 * whenever the route changes, with the previous page as the referrer.
 */
export function setPageContext(pageLocation: string, pageReferrer: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("set", {
      page_location: pageLocation,
      page_referrer: pageReferrer,
    });
  }
}

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
      page_location: currentPageLocation(),
      ...(document.title ? { page_title: document.title } : {}),
      ...params,
    });
  }
}
