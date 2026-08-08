import { withSentryConfig } from "@sentry/nextjs";
import createJiti from "jiti";
import { fileURLToPath } from "node:url";
import path from "path";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jiti = createJiti(fileURLToPath(import.meta.url));

const { env } = jiti("./src/env/server.ts");
jiti("./src/env/client.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nothing in this app is meant to be framed by another site.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Keep score/user ids out of Referer on outbound game links.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Bugsink speaks the Sentry protocol, but it is not sentry.io.
  sentryUrl: env.SENTRY_URL,
  org: env.SENTRY_ORG,
  project: env.SENTRY_PROJECT,
  authToken: env.SENTRY_AUTH_TOKEN,

  // Never phone home to sentry.io from a self-hosted setup.
  telemetry: false,
  // Stay quiet unless we're actually uploading, then surface upload errors.
  silent: !env.SENTRY_AUTH_TOKEN,

  // Uploading is opt-in: without a token the build just emits no source maps.
  sourcemaps: {
    disable: !env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  // Bugsink matches source maps by debug ID and has no release API to call,
  // but still tags events with the injected release name.
  release: {
    create: false,
    finalize: false,
    inject: true,
  },

  widenClientFileUpload: true,

  // A self-hosted Bugsink being unreachable shouldn't break a deploy - the
  // build just ships without readable stack traces for that release.
  errorHandler: (error) => {
    console.warn("[bugsink] source map upload failed:", error.message);
  },
});
