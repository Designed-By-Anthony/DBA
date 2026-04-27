# Designed by Anthony — web

Single **Next.js 16** application: marketing site, APIs, and the Lighthouse audit segment (same deploy).

## Routing — `src/proxy.ts`

[`src/proxy.ts`](./src/proxy.ts) runs on the Netlify Next.js runtime (Next.js 16 **proxy** convention). It reads `Host` and handles VertaFlow redirects only — the audit lives on the apex at `/lighthouse`.

```
admin.designedbyanthony.com/*       →  308 → https://admin.vertaflow.io/*
accounts.designedbyanthony.com/*    →  308 → https://accounts.vertaflow.io/*
* (everything else, including /lighthouse) → this Next app (fallthrough)
```

### Optional env on the Netlify site

| Name                      | When needed                                              |
| ------------------------- | -------------------------------------------------------- |
| `GOOGLE_PAGESPEED_API_KEY`, `GEMINI_API_KEY` | Required for `/lighthouse` audits to actually run |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Bot gate for `/api/audit`. In Cloudflare Turnstile, add **all** hostnames that load the widget (production + Netlify preview URLs) or the challenge returns **400**. |
| `AUDIT_LOGGING_WEBHOOK_URL` | Optional: after each successful **`POST /api/audit`**, POST a JSON summary to your logging endpoint (e.g. Convex `.../webhook/audit`). Unset = disabled. |
| `FRESHWORKS_CRM_SYNC_ENABLED`, `FRESHWORKS_CRM_BASE_URL`, `FRESHWORKS_CRM_API_KEY` | Optional: log each successful `/api/audit` as a **Freshsales Lead** (see `.env.example`) |

## GitLab CLI (`glab`)

Optional tool for **merge requests**, pipelines, and API tasks from the terminal. Not required to build the site.

```bash
bash scripts/install-glab.sh   # Linux amd64 → /usr/local/bin/glab (needs sudo)
glab auth login                 # then: glab mr list, glab mr create, etc.
```

See **`AGENTS.md`** (GitLab CLI section) for token env vars and agent/CI notes.

## Lighthouse Scanner (`/lighthouse`)

Free **technical + performance audit** (PageSpeed Insights, on-page HTML signals, crawlability, optional Places/Moz, AI summary). Product copy, feature table, env checklist, and paste-ready hero text live in **[`lighthouse2.md`](./lighthouse2.md)** at the repo root — structured like common SEO audit READMEs (feature blocks + stack + usage) so marketing and OG metadata stay aligned.

## Build

```bash
npm install
npm run dev       # :3000 (builds public/scripts/site.js first)
npm run build     # site script + sync static headers + next build
```

Deploy on **Netlify** from the repo root via **GitLab-connected auto deploys**. `netlify.toml` is regenerated on each `npm run sync:static-headers` (runs in `prebuild`) with:
- `command = "npm run build"`
- `NODE_VERSION = "22"`
- `@netlify/plugin-nextjs` runtime plugin (no static `.next` publish directory)

Security headers and CSP are set in `next.config.ts` from `build/csp.mjs`.

## Global theme + brand

Author global CSS tokens in [`src/styles/theme.css`](./src/styles/theme.css) and keep [`src/design-system/tokens.css`](./src/design-system/tokens.css) in sync. The app imports [`src/design-system/dba-global.css`](./src/design-system/dba-global.css) from the root layout.
