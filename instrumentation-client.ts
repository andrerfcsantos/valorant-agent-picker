import { initAnalytics } from "@/lib/analytics";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Production builds are guarded in next.config.ts. Anywhere else, a missing
// token just leaves analytics off, so a dev server runs without PostHog set up.
if (projectToken && host) {
  initAnalytics(projectToken, host);
} else if (process.env.NODE_ENV === "development") {
  console.info(
    "PostHog is off: set NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST to enable it (see .env.example).",
  );
}
