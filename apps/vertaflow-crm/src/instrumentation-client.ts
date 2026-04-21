// Client instrumentation hook — Sentry init lives in `sentry.client.config.ts` (single source of truth).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
