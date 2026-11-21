"use client";

import type { ShareSource, ShareType } from "@/lib/analytics";
import { useShareLink } from "@/hooks/useShareLink";

interface ShareButtonProps {
  /** Built lazily so the link always reflects the current state. */
  buildUrl: () => string;
  /** Which of the share surfaces this is, for analytics. */
  shareType: ShareType;
  /** Where on the site the control lives, for analytics. */
  shareSource: ShareSource;
  label?: string;
  copiedLabel?: string;
  title?: string;
  className?: string;
}

export default function ShareButton({
  buildUrl,
  shareType,
  shareSource,
  label = "Share link",
  copiedLabel = "Link copied!",
  title,
  className,
}: ShareButtonProps) {
  const { copied, fallbackUrl, copy } = useShareLink({
    buildUrl,
    shareType,
    shareSource,
  });

  return (
    <>
      <button className={className} onClick={copy} title={title}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginRight: "0.4rem",
            flexShrink: 0,
            display: "inline",
            verticalAlign: "-0.1em",
          }}
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? copiedLabel : label}
      </button>
      {fallbackUrl && (
        <input
          className="share-fallback-input"
          type="text"
          readOnly
          value={fallbackUrl}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Share link"
        />
      )}
    </>
  );
}
