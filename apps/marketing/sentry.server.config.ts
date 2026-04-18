import * as Sentry from '@sentry/astro';

/**
 * Server / SSR (Node). Injected by `@sentry/astro` (`page-ssr`).
 * https://docs.sentry.io/platforms/javascript/guides/astro/#configure-server-side-sentry
 */
const dsn = process.env.SENTRY_DSN ?? process.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}
