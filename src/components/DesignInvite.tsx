"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useDesign } from "@/context/DesignContext";
import { DESIGN_INVITE_DISMISSED_KEY } from "@/lib/design";
import { getBoolFromLS, setBoolToLS } from "@/lib/localStorage";

/**
 * Tells visitors on the classic design that a new one exists. It goes away
 * for good once closed, and never shows to someone who has already made a
 * choice either way; the navbar keeps a switch for anyone who changes their
 * mind later.
 */
export default function DesignInvite() {
  const { design, chosen, setDesign } = useDesign();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- whether it was dismissed is in localStorage, read after mount
    setDismissed(getBoolFromLS(DESIGN_INVITE_DISMISSED_KEY, false));
  }, []);

  if (design !== "classic" || chosen || dismissed) return null;

  return (
    <aside className="design-invite" aria-label="New design">
      <p>
        The agent picker has a new design. Switch back whenever you like from
        the top bar.
      </p>
      <span className="design-invite-actions">
        <button
          type="button"
          className="design-invite-try"
          onClick={() => {
            setDesign("refresh", "invite");
            // This button goes away with the invitation, which would drop
            // keyboard focus on <body>. Hand it to the new page's heading
            // once that page has rendered.
            requestAnimationFrame(() =>
              document.querySelector<HTMLElement>("main h1")?.focus(),
            );
          }}
        >
          Try the new design
        </button>
        <button
          type="button"
          className="design-invite-dismiss"
          onClick={() => {
            setDismissed(true);
            setBoolToLS(DESIGN_INVITE_DISMISSED_KEY, true);
            track("design_invite_dismissed", {});
          }}
        >
          Not now
        </button>
      </span>
    </aside>
  );
}
