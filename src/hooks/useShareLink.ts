"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShareSource, ShareType, track } from "@/lib/analytics";

interface ShareLinkOptions {
  /** Built lazily so the link always reflects the current state. */
  buildUrl: () => string;
  /** Which of the share surfaces this is, for analytics. */
  shareType: ShareType;
  /** Where on the site the control lives, for analytics. */
  shareSource: ShareSource;
}

/** How long a control says the link was copied before going back. */
const COPIED_MS = 1800;

/**
 * Copying a share link, for any control that offers one. `copied` is true for
 * a moment after a copy, and `fallbackUrl` holds the link when the clipboard
 * refused it, to be shown so it can still be copied by hand. It is built
 * again on every render, so a link left showing follows what it links to
 * rather than keeping the state it was asked for in.
 */
export function useShareLink({
  buildUrl,
  shareType,
  shareSource,
}: ShareLinkOptions) {
  const [copied, setCopied] = useState(false);
  const [refused, setRefused] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  /** Resolves to whether the link reached the clipboard. */
  const copy = useCallback(async () => {
    const url = buildUrl();
    try {
      await navigator.clipboard.writeText(url);
      setRefused(false);
      setCopied(true);
      track("share_link_copied", {
        share_type: shareType,
        source: shareSource,
        method: "clipboard",
      });
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
      return true;
    } catch {
      // The clipboard API needs a secure context and permission. Show the link
      // so it can still be copied by hand.
      setRefused(true);
      track("share_link_copied", {
        share_type: shareType,
        source: shareSource,
        method: "fallback",
      });
      return false;
    }
  }, [buildUrl, shareType, shareSource]);

  return { copied, fallbackUrl: refused ? buildUrl() : null, copy };
}
