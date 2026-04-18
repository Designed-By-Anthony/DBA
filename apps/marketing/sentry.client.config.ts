import * as Sentry from '@sentry/astro';

/**
 * Client SDK (browser). Config lives here so we do not pass deprecated keys through
 * `astro.config`’s Sentry integration. Matches Sentry’s Astro manual setup:
 * https://docs.sentry.io/platforms/javascript/guides/astro/
 *
 * `astro.config` uses `bundleSizeOptimizations.excludeTracing: true` — do not add
 * `browserTracingIntegration()` here.
 */
const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      import.meta.env.PUBLIC_VERCEL_ENV ?? import.meta.env.MODE,
    release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA,
    /** Avoid noise from local `astro dev` (preview uses production build). */
    enabled: import.meta.env.PROD,
    sendDefaultPii: true,
    enableLogs: true,

    integrations: [Sentry.replayIntegration()],

    tracesSampleRate: 0,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /challenges\.cloudflare\.com/i,
      /^Script error\.?$/,
      /** Turnstile 110200 = hostname not in site key allowlist (common on localhost). */
      /110200/,
      /TurnstileError/,
    ],

    beforeSend(event) {
      if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
      }
      return event;
    },
  });
}
