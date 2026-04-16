import * as Sentry from "@sentry/nextjs";
import { analyticsAllowed } from "./lib/cookieConsent";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const hasDsn = Boolean(dsn);

if (hasDsn) {
  const analyticsOk = analyticsAllowed();

  Sentry.init({
    dsn,

    // Replay, full tracing, PII, and logs only after opt-in (see CookieConsentBanner).
    sendDefaultPii: analyticsOk,

    tracesSampleRate: analyticsOk
      ? process.env.NODE_ENV === "development"
        ? 1.0
        : 0.1
      : 0,

    replaysSessionSampleRate: analyticsOk ? 0.1 : 0,
    replaysOnErrorSampleRate: analyticsOk ? 1.0 : 0,

    enableLogs: analyticsOk,

    integrations: analyticsOk ? [Sentry.replayIntegration()] : [],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
