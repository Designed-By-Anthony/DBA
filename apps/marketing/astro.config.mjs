// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import indexNowStaticPages from './build/indexnow-integration.mjs';

import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';

// The "Zod" environment guard — fails the Astro build if Agency OS
// secrets (DATABASE_URL, CLERK_SECRET_KEY) bleed onto the marketing
// Vercel project (env-bleed detection). See packages/env/README.md.
import { validateMarketingEnv } from '@dba/env/marketing';

validateMarketingEnv();

const SITEMAP_EXCLUDED_URLS = new Set([
  'https://designedbyanthony.com/404',
  'https://designedbyanthony.com/404/',
  'https://designedbyanthony.com/facebook-offer',
  'https://designedbyanthony.com/facebook-offer/',
  'https://designedbyanthony.com/report',
  'https://designedbyanthony.com/report/',
  'https://designedbyanthony.com/thank-you',
  'https://designedbyanthony.com/thank-you/',
]);
const indexNowKey = process.env.INDEXNOW_KEY ?? 'a503ff689a18407993ac047df017d9a8';

const integrations = [
  sitemap({
    filter: (page) => !SITEMAP_EXCLUDED_URLS.has(page),
  }),
  indexNowStaticPages({
    key: indexNowKey,
    excludeUrls: SITEMAP_EXCLUDED_URLS,
    ...(process.env.INDEXNOW_ENDPOINT ? { primaryEndpoint: process.env.INDEXNOW_ENDPOINT } : {}),
    ...(process.env.INDEXNOW_FALLBACK_ENDPOINTS !== undefined
      ? {
          fallbackEndpoints: process.env.INDEXNOW_FALLBACK_ENDPOINTS.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : {}),
  }),
  sentry({
    org: 'designed-by-anthony',
    project: 'javascript-astro',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Avoid failing local/CI builds when the token is not set; enable uploads where SENTRY_AUTH_TOKEN is present.
    sourcemaps: {
      disable: !process.env.SENTRY_AUTH_TOKEN,
    },
    /** Smaller client bundle; drops Browser Tracing + “sentry-tracing-init” user timing / long tasks. */
    bundleSizeOptimizations: {
      excludeTracing: true,
    },
  }),
];

/**
 * Spotlight’s Astro dev toolbar can throw inside its a11y stack (aria-query) on valid roles like
 * role="status", which poisons the page JS context and surfaces as Turnstile 110200 on /free-seo-audit
 * and /contact. Opt-in only: `SPOTLIGHT=1 npm run dev` or `npm run dev:spotlight`.
 */
if (process.env.NODE_ENV === 'development' && process.env.SPOTLIGHT === '1') {
  integrations.push(spotlightjs());
}

// https://astro.build/config
export default defineConfig({
  site: 'https://designedbyanthony.com',
  // Opt-in prefetch via data-astro-prefetch on internal links (see Layout / FooterCTA) to avoid prefetching every link on the page.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  /** Leaner client chunks (fewer Baseline polyfills in Lighthouse “legacy JavaScript”). */
  vite: {
    build: {
      target: 'es2022',
    },
  },
  integrations,
});