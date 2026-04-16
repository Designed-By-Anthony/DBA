// Server-side Sentry configuration.
// Runs whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://683937a1c740966b75324623aedaa984@o4511201601912832.ingest.us.sentry.io/4511207873511424",

  // Performance: 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  enableLogs: true,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV,

  // Spotlight for local dev debugging
  spotlight: process.env.NODE_ENV === "development",
});
