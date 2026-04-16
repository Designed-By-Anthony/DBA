import * as Sentry from '@sentry/astro';

const dsn =
  process.env.SENTRY_DSN ??
  'https://0d490516ab9f385b16ea4210a1f9622e@o4511201601912832.ingest.us.sentry.io/4511201603158016';

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV ?? 'development',
  sendDefaultPii: true,
  enableLogs: true,
  tracesSampleRate: 1.0,
});
