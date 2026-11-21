"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { DESIGN_FEEDBACK_DISMISSED_KEY, FEEDBACK_URL } from "@/lib/design";
import { getBoolFromLS, setBoolToLS } from "@/lib/localStorage";
import styles from "./FeedbackBanner.module.css";

/**
 * Asks visitors on the new design what they think of it, on Discord. It sits
 * at the top of a page's wide column rather than across the page, so the
 * result rail beside it keeps the full height of the window. Closed once, it
 * stays closed on every page.
 */
export default function FeedbackBanner() {
  // Hidden until storage says otherwise, so it never flashes for someone who
  // has already closed it.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- whether it was dismissed is in localStorage, read after mount
    setDismissed(getBoolFromLS(DESIGN_FEEDBACK_DISMISSED_KEY, false));
  }, []);

  if (dismissed) return null;

  return (
    <aside className={styles.banner} aria-label="Feedback on the new design">
      <p className={styles.text}>
        You&apos;re using the new design. Tell us what works and what
        doesn&apos;t.
      </p>
      <a
        className={styles.go}
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("design_feedback_clicked", {})}
      >
        Share feedback on Discord
      </a>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss the feedback request"
        title="Dismiss"
        onClick={() => {
          setDismissed(true);
          setBoolToLS(DESIGN_FEEDBACK_DISMISSED_KEY, true);
          track("design_feedback_dismissed", {});
        }}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M3 3l10 10M13 3L3 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </aside>
  );
}
