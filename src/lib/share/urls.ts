import { encodeShare } from "./codec";
import { ShareKind, SharePayload } from "./types";

/** Query parameter carrying the encoded payload. */
export const SHARE_PARAM = "d";

/**
 * Where each kind of payload is meant to be read. Results get the dedicated
 * reveal pages; presets land in the normal UI. Because the kind travels inside
 * the payload, a link opened on the wrong page can redirect itself.
 */
export const SHARE_PATHS: Record<ShareKind, string> = {
  "agent-result": "/share/agent",
  "squad-result": "/share/squad",
  "picker-preset": "/",
  "squad-preset": "/squad",
};

export function sharePath(payload: SharePayload): string {
  const encoded = encodeShare(payload);
  return `${SHARE_PATHS[payload.kind]}?${SHARE_PARAM}=${encoded}`;
}

/** Absolute link for copying. Client-only; falls back to a relative path. */
export function shareUrl(payload: SharePayload): string {
  const path = sharePath(payload);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

/** Reads the payload parameter out of a query string. */
export function readShareParam(search: string): string | null {
  return new URLSearchParams(search).get(SHARE_PARAM);
}

/**
 * Drops the payload from the address bar once it has been applied, so a reload
 * behaves like a normal visit instead of re-applying a preset the visitor may
 * have already undone.
 */
export function stripShareParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
