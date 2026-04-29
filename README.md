# Designed by Anthony — Turborepo web

Public frontend is deployed via **Cloudflare Pages** (advanced mode with `_worker.js`), while APIs run on the separate **Cloudflare Worker** in `apps/api`.

## Routing — `apps/web/src/middleware.ts`

[`apps/web/src/middleware.ts`](./apps/web/src/middleware.ts) runs as Edge middleware for Cloudflare Pages. It reads `Host` and handles VertaFlow redirects only — the audit lives on the apex at `/lighthouse`.

```
admin.designedbyanthony.com/*       →  308 → https://admin.vertaflow.io/*
accounts.designedbyanthony.com/*    →  308 → https://accounts.vertaflow.io/*
* (everything else, including /lighthouse) → this Next app (fallthrough)
```

### Optional env (Cloudflare Pages + Workers / local)

| Name                      | When needed                                              |
| ------------------------- | -------------------------------------------------------- |
| `GOOGLE_PAGESPEED_API_KEY`, `GEMINI_API_KEY` | Required for `/lighthouse` audits to actually run |
| `RECAPTCHA_ENTERPRISE_API_KEY` (+ optional `RECAPTCHA_ENTERPRISE_PROJECT_ID`) | Optional Google reCAPTCHA Enterprise verification for **`POST /api/audit`**. Public site key defaults to the DBA key; set the server API key on the API Worker to enforce token assessment. |
| `LIGHTHOUSE_STRICT_TURNSTILE` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Optional strict bot gate for **`POST /api/audit`**. Default: audits run without Turnstile (rate limit only). When strict mode is on, add all preview hostnames in Cloudflare or challenges return **400**. |
| `AUDIT_LOGGING_WEBHOOK_URL` | Optional: after each successful **`POST /api/audit`**, POST a JSON summary to your logging endpoint (e.g. Convex `.../webhook/audit`). Unset = disabled. |
| `LEAD_WEBHOOK_URL` | Required for **`POST /api/lead-email`** to forward marketing leads (e.g. Convex → Slack). See `.env.example`. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_ENTERPRISE_API_KEY` + `GOOGLE_CLOUD_PROJECT` (or `RECAPTCHA_GOOGLE_CLOUD_PROJECT`) | Optional **reCAPTCHA Enterprise** for marketing forms (`CreateAssessment`); see `.env.example`. |

## Lighthouse Scanner (`/lighthouse`)

Free **technical + performance audit** (PageSpeed Insights, on-page HTML signals, crawlability, optional Places/Moz, AI summary). Product copy, feature table, env checklist, and paste-ready hero text live in **[`lighthouse2.md`](./lighthouse2.md)** at the repo root — structured like common SEO audit READMEs (feature blocks + stack + usage) so marketing and OG metadata stay aligned.

## Build

```bash
bun install
bun run dev       # turbo: Next.js (:3000) + Elysia Worker (:8787)
bun run dev:web   # Next.js frontend only
bun run dev:api   # ElysiaJS Worker only
bun run build     # turbo: full production build (web emits .vercel/output/static for Pages)
```

Deploy commands:

```bash
bun run deploy:web     # Cloudflare Pages frontend
bun run deploy:api     # Cloudflare Worker API
```

**Cloudflare Pages (dashboard):** Build command **`bun install --frozen-lockfile && bun run build`** (or **`bun x turbo run build --filter=@dba/web`** if you skip the API package). **Deploy command:** leave **empty** — Pages uploads `apps/web/wrangler.jsonc` → **`pages_build_output_dir`** (`.vercel/output/static` with `_worker.js`) automatically. Do **not** set deploy to **`wrangler versions upload`** (that targets Workers and fails with “Missing entry-point”).

`NEXT_PUBLIC_API_BASE_URL` defaults to `https://api.designedbyanthony.com`; set it only when a preview or alternate API Worker should be used. Environment variables and secrets are managed in Cloudflare (Workers & Pages -> Settings -> Variables & Secrets). `bun run --cwd apps/web sync:static-headers` (also run by web prebuild) regenerates `apps/web/static-headers.json` from `apps/web/build/csp.mjs` for Playwright CSP parity. Cloudflare Pages should use root `/apps/web`, build command `bun install && bun x turbo run build --filter=@dba/web`, and output `/.vercel/output/static`. Keep build commands in the Pages dashboard/CI settings; `apps/web/wrangler.jsonc` is only for Pages-supported runtime config such as `pages_build_output_dir`, compatibility date, flags, and bindings.

Security headers and CSP are set in `next.config.ts` from `build/csp.mjs`.

## Global theme + brand

Author global CSS tokens in [`apps/web/src/styles/theme.css`](./apps/web/src/styles/theme.css) and keep [`apps/web/src/design-system/tokens.css`](./apps/web/src/design-system/tokens.css) in sync. The app imports [`apps/web/src/design-system/dba-global.css`](./apps/web/src/design-system/dba-global.css) from the root layout.
