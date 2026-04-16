// This file configures the initialization of Sentry on the client (browser).
// It runs whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://683937a1c740966b75324623aedaa984@o4511201601912832.ingest.us.sentry.io/4511207873511424",

  // Performance tracing — capture 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay — capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      autoInject: true,  // Automatically embeds the floating "Report a Bug" button
      colorScheme: "dark",
      themeDark: {
        background: "#0a0c12", // var(--color-surface-1)
        foreground: "#f7f4ee", // var(--color-text-white)
        submitBackground: "#5b9cf8", // matches var(--color-accent-blue)
        submitForeground: "#ffffff",
      },
    }),
  ],

  // Enable logs
  enableLogs: true,

  // Enable PII for richer error context
  sendDefaultPii: true,

  // Don't send errors from local dev unless explicitly enabled
  enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE_DEV === "true",

  // Tag every event with environment
  environment: process.env.NODE_ENV,
});
