"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { currentPageLocation, sendEvent } from "@/lib/analytics";

// How long to wait for the new page's title before sending the page_view
// with whatever title the document has.
const TITLE_WAIT_MS = 1000;

/**
 * Sends a GA4 page_view on client-side route changes. The inline gtag
 * snippet in the root layout sends the first page load's page_view. GA4's
 * enhanced measurement does not pick up this router's history changes, so
 * without this, in-app visits to other pages would go uncounted. If "Page
 * changes based on browser history events" is ever enabled for the GA4
 * property, remove this component to avoid counting each navigation twice.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const lastSentTitle = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousPathname.current;
    previousPathname.current = pathname;
    if (previous === null) {
      lastSentTitle.current = document.title;
      return;
    }
    if (previous === pathname) return;

    // The router usually clears document.title and sets the new one a little
    // after the route change, so wait for a non-empty title before sending.
    const pageLocation = currentPageLocation();
    let sent = false;
    const send = () => {
      if (sent) return;
      // oxlint-disable-next-line react/immutability -- `sent` is local to this effect run, never read during render
      sent = true;
      observer.disconnect();
      clearTimeout(fallback);
      lastSentTitle.current = document.title;
      sendEvent("page_view", {
        page_location: pageLocation,
        page_title: document.title,
      });
    };
    const observer = new MutationObserver(() => {
      if (document.title) send();
    });
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const fallback = setTimeout(send, TITLE_WAIT_MS);

    // The new title may already be in place.
    if (document.title && document.title !== lastSentTitle.current) send();

    // Navigating again before the title arrives still records this page.
    return send;
  }, [pathname]);

  return null;
}
