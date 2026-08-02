import * as Sentry from "@sentry/nextjs";

import { env } from "@/env/client";

export async function register() {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NODE_ENV,
    // Local errors show up in the console already; only ship real ones.
    enabled: env.NODE_ENV === "production",

    // Bugsink only ingests error events - traces are intentionally unsupported.
    tracesSampleRate: 0,

    // Bugsink is self-hosted, so the extra request/user context is worth having.
    sendDefaultPii: true,
  });
}

// Next.js 15+ only; harmlessly ignored on 14, where the SDK's webpack plugin
// wraps route handlers and server components automatically instead.
export const onRequestError = Sentry.captureRequestError;
