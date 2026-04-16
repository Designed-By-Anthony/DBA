import * as Sentry from '@sentry/astro';

/**
 * Client SDK: keep errors, drop tracing/replay payload (see Lighthouse unused JS / main-thread tasks).
 * Config lives here so we do not pass deprecated keys through `astro.config`’s Sentry integration.
 */
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.PUBLIC_VERCEL_ENV ?? import.meta.env.MODE,
  release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
