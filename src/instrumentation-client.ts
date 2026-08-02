import * as Sentry from "@sentry/nextjs";

import { env } from "@/env/client";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NODE_ENV,
    // Local errors show up in the console already; only ship real ones.
    enabled: env.NODE_ENV === "production",

    // Bugsink only ingests error events - traces are intentionally unsupported.
    tracesSampleRate: 0,

    // Bugsink is self-hosted, so the extra request/user context is worth having.
    sendDefaultPii: true,

    // Release health sends a session envelope on every route change, which
    // Bugsink discards. Drop the integration so we don't burn ingestion quota.
    integrations: (defaults) =>
      defaults.filter((integration) => integration.name !== "BrowserSession"),
  });
}

// Tracing is off, so this is a no-op - it just silences the SDK's build warning.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
