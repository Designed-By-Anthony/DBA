# Designed by Anthony — web

Single **Next.js 16** application: marketing site, APIs, and the Lighthouse audit segment (same deploy).

## Routing — `src/proxy.ts`

[`src/proxy.ts`](./src/proxy.ts) runs on the Next.js 16 **proxy** convention. It reads `Host` and handles VertaFlow redirects only — the audit lives on the apex at `/lighthouse`.

```
admin.designedbyanthony.com/*       →  308 → https://admin.vertaflow.io/*
accounts.designedbyanthony.com/*    →  308 → https://accounts.vertaflow.io/*
* (everything else, including /lighthouse) → this Next app (fallthrough)
```

### Optional env (Firebase App Hosting / local)

| Name                      | When needed                                              |
| ------------------------- | -------------------------------------------------------- |
| `GOOGLE_PAGESPEED_API_KEY`, `GEMINI_API_KEY` | Required for `/lighthouse` audits to actually run |
| `LIGHTHOUSE_STRICT_TURNSTILE` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Optional strict bot gate for **`POST /api/audit`**. Default: audits run without Turnstile (rate limit only). When strict mode is on, add all preview hostnames in Cloudflare or challenges return **400**. |
| `AUDIT_LOGGING_WEBHOOK_URL` | Optional: after each successful **`POST /api/audit`**, POST a JSON summary to your logging endpoint (e.g. Convex `.../webhook/audit`). Unset = disabled. |
| `LEAD_WEBHOOK_URL` | Required for **`POST /api/contact`** to forward marketing leads (e.g. Convex → Slack). See `.env.example`. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_ENTERPRISE_API_KEY` + `GOOGLE_CLOUD_PROJECT` (or `RECAPTCHA_GOOGLE_CLOUD_PROJECT`) | Optional **reCAPTCHA Enterprise** for marketing forms (`CreateAssessment`); see `.env.example`. |

## Lighthouse Scanner (`/lighthouse`)

Free **technical + performance audit** (PageSpeed Insights, on-page HTML signals, crawlability, optional Places/Moz, AI summary). Product copy, feature table, env checklist, and paste-ready hero text live in **[`lighthouse2.md`](./lighthouse2.md)** at the repo root — structured like common SEO audit READMEs (feature blocks + stack + usage) so marketing and OG metadata stay aligned.

## Build

```bash
npm install
npm run dev       # :3000 (builds public/scripts/site.js first)
npm run build     # site script + sync static headers + next build
```

Deploy from the repo root on **Firebase App Hosting** with the **GitHub** repo linked in Firebase console. `npm run sync:static-headers` (runs in `prebuild`) still regenerates `netlify.toml` + `static-headers.json` from `build/csp.mjs` for CSP alignment.

Security headers and CSP are set in `next.config.ts` from `build/csp.mjs`.

## Global theme + brand

Author global CSS tokens in [`src/styles/theme.css`](./src/styles/theme.css) and keep [`src/design-system/tokens.css`](./src/design-system/tokens.css) in sync. The app imports [`src/design-system/dba-global.css`](./src/design-system/dba-global.css) from the root layout.
