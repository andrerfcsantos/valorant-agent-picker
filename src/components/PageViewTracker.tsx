"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendEvent } from "@/lib/analytics";

// How long to wait for the new page's title before sending the page_view
// with whatever title the document has.
const TITLE_WAIT_MS = 1000;

/**
 * Sends a GA4 page_view on client-side route changes. The gtag config call
 * already records the first page load. GA4's enhanced measurement does not
 * pick up this router's history changes, so without this, in-app visits to
 * other pages would go uncounted. If "Page changes based on browser history
 * events" is ever enabled for the GA4 property, remove this component to
 * avoid counting each navigation twice.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousPathname.current;
    previousPathname.current = pathname;
    if (previous === null || previous === pathname) return;

    // The router clears document.title and sets the new one a little after
    // the route change, so wait for a non-empty title before sending.
    const pageLocation = window.location.href;
    let sent = false;
    const send = () => {
      if (sent) return;
      // oxlint-disable-next-line react/immutability -- `sent` is local to this effect run, never read during render
      sent = true;
      observer.disconnect();
      clearTimeout(fallback);
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

    // Navigating again before the title arrives still records this page.
    return send;
  }, [pathname]);

  return null;
}
