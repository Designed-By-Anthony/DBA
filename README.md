# Designed by Anthony — Turborepo web

## Architecture (two Cloudflare surfaces — required setup)

| Surface | What | Repo | Deploy |
|--------|------|------|--------|
| **Cloudflare Pages** | Next.js 16 (OpenNext) — HTML, assets, **`_worker.js`** for SSR/middleware | `apps/web/` | Git-connected **Pages** project with repo root **`.`** → build outputs **`apps/web/.vercel/output/static`** · **deploy command empty** |
| **Cloudflare Worker** | ElysiaJS API — **`POST /api/*`** etc. | `apps/api/` | **Separate** Worker deploy — **`bun run deploy:api`** / **`wrangler deploy`** from **`apps/api`** · Worker name **`dba-api`** · hostname **`api.designedbyanthony.com`** |

The browser talks to the API via **`NEXT_PUBLIC_API_BASE_URL`** (defaults to `https://api.designedbyanthony.com`). Pages does **not** replace the API Worker.

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

**Cloudflare Pages (dashboard):** Use repository root **`.`**. Build command **`bun install --frozen-lockfile && bun x turbo run build --filter=@dba/web`**. **Deploy command:** leave **empty** — Pages reads root [`wrangler.jsonc`](./wrangler.jsonc) and uploads **`apps/web/.vercel/output/static`** (`_worker.js` + assets) automatically. Do **not** set deploy to **`wrangler versions upload`** (that targets standalone Workers and fails with “Missing entry-point”).

`NEXT_PUBLIC_API_BASE_URL` defaults to `https://api.designedbyanthony.com`; set it only when a preview or alternate API Worker should be used. Environment variables and secrets are managed in Cloudflare (Workers & Pages -> Settings -> Variables & Secrets). `bun run --cwd apps/web sync:static-headers` (also run by web prebuild) regenerates `apps/web/static-headers.json` from `apps/web/build/csp.mjs` for Playwright CSP parity. The root `wrangler.jsonc` is the canonical Pages config for Git-connected Cloudflare builds; `apps/web/wrangler.jsonc` is kept for local/manual deploys run from `apps/web`.

### Cloudflare dashboard checklist (Pages + API Worker)

**Pages (marketing frontend)** — project name in repo defaults: `designed-by-anthony` (`CLOUDFLARE_PAGES_PROJECT_NAME`).

| Setting | Value |
|--------|--------|
| Root directory | Repository root **`.`** |
| Install command | **`bun install --frozen-lockfile`** |
| Build command | **`bun x turbo run build --filter=@dba/web`** |
| Build output directory | **`apps/web/.vercel/output/static`** |
| Deploy command | **Empty** — Pages uploads `_worker.js` + assets from `pages_build_output_dir` after build. Do **not** run **`wrangler versions upload`** here (that targets standalone Workers). |
| Node version | **22.12.0** (`.nvmrc`) |
| Compatibility | **`nodejs_compat`** from root `wrangler.jsonc` |

**Wrangler config path:** root [`wrangler.jsonc`](./wrangler.jsonc). This is what prevents Pages from missing `nodejs_compat` and serving a 500 from an otherwise valid OpenNext bundle.

**API Worker (`apps/api`)** — separate from Pages: deploy with **`bun run deploy:api`** or **`wrangler deploy`** from **`apps/api`** (Worker name in **`apps/api/wrangler.jsonc`**: **`dba-api`**). Custom domains (e.g. **`api.designedbyanthony.com`**) are attached in the dashboard to that Worker script.

Security headers and CSP are set in `next.config.ts` from `build/csp.mjs`.

## Global theme + brand

Author global CSS tokens in [`apps/web/src/styles/theme.css`](./apps/web/src/styles/theme.css) and keep [`apps/web/src/design-system/tokens.css`](./apps/web/src/design-system/tokens.css) in sync. The app imports [`apps/web/src/design-system/dba-global.css`](./apps/web/src/design-system/dba-global.css) from the root layout.
