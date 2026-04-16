import * as Sentry from '@sentry/astro';

const dsn =
  import.meta.env.PUBLIC_SENTRY_DSN ??
  'https://0d490516ab9f385b16ea4210a1f9622e@o4511201601912832.ingest.us.sentry.io/4511201603158016';

Sentry.init({
  dsn,
  environment: import.meta.env.MODE,
  /** Avoid noise from local dev and preview; `beforeSend` still drops localhost when PROD is on. */
  enabled: import.meta.env.PROD,
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  enableLogs: true,
  /** Lower than 1.0 reduces client trace overhead (TBT) while keeping a representative sample. */
  tracesSampleRate: 0.25,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /challenges\.cloudflare\.com/i,
    /^Script error\.?$/,
    /** Turnstile 110200 = hostname not in site key allowlist (common on localhost until Cloudflare dashboard is updated). */
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
