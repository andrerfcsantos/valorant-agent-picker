"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useDesign } from "@/context/DesignContext";
import {
  DESIGN_CLASSIC_NOTICE_DISMISSED_KEY,
  FEEDBACK_URL,
} from "@/lib/design";
import { getBoolFromLS, setBoolToLS } from "@/lib/localStorage";
import { focusPageHeading } from "@/lib/pageHeading";

/**
 * Tells visitors still on the classic design that it is going away, with a
 * way onto the new one and a place to say why they stayed. Closed once, it
 * stays closed; the navbar keeps the switch either way.
 */
export default function ClassicDesignNotice() {
  const { design, setDesign } = useDesign();
  // Hidden until storage says otherwise, so it never flashes for someone who
  // has already closed it.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- whether it was dismissed is in localStorage, read after mount
    setDismissed(getBoolFromLS(DESIGN_CLASSIC_NOTICE_DISMISSED_KEY, false));
  }, []);

  if (design !== "classic" || dismissed) return null;

  return (
    <aside className="classic-notice" aria-label="Classic design">
      <p>You&apos;re on the classic design, which will be discontinued soon.</p>
      <span className="classic-notice-actions">
        <button
          type="button"
          className="classic-notice-switch"
          onClick={() => {
            setDesign("refresh", "classic_notice");
            // This button goes away with the notice, which would drop
            // keyboard focus on <body>. Hand it to the new page's heading
            // once that page has rendered.
            focusPageHeading();
          }}
        >
          Switch to the new design
        </button>
        <a
          className="classic-notice-feedback"
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("design_feedback_clicked", {})}
        >
          Share feedback on Discord
        </a>
        <button
          type="button"
          className="classic-notice-dismiss"
          aria-label="Dismiss the classic design notice"
          title="Dismiss"
          onClick={(event) => {
            // Same as above: the notice goes, and this button with it.
            if (document.activeElement === event.currentTarget) {
              focusPageHeading();
            }
            setDismissed(true);
            setBoolToLS(DESIGN_CLASSIC_NOTICE_DISMISSED_KEY, true);
            track("design_classic_notice_dismissed", {});
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
      </span>
    </aside>
  );
}
