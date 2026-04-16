import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
// The "Zod" environment guard — fails the build if web-viewer / Stripe
// secrets accidentally bleed onto the Lighthouse Vercel project.
import { validateLighthouseEnv } from "@dba/env/lighthouse";

validateLighthouseEnv();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://designedbyanthony.com https://*.designedbyanthony.com http://localhost:3000 http://localhost:4321;",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Wizard defaults — override via SENTRY_ORG / SENTRY_PROJECT in CI or .env
  org: process.env.SENTRY_ORG ?? "designed-by-anthony",
  project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  tunnelRoute: "/monitoring",

  silent: !process.env.CI,

  /**
   * Do not fail `next build` when the auth token is missing locally.
   * Set SENTRY_AUTH_TOKEN in CI / App Hosting for source map uploads.
   */
  errorHandler: (err) => {
    console.warn("[Sentry build plugin]", err.message);
  },

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
