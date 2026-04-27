# Designed by Anthony — web

Single **Next.js 16** application: marketing site, APIs, and the Lighthouse audit segment (same deploy).

## Routing — `src/middleware.ts`

[`src/middleware.ts`](./src/middleware.ts) runs on the Netlify Next.js runtime. It reads `Host` and handles VertaFlow redirects, `lighthouse.*` (in-app or optional `LIGHTHOUSE_UPSTREAM_URL`), and hides `/lighthouse` on the apex host.

```
admin.designedbyanthony.com/*       →  308 → https://admin.vertaflow.io/*
accounts.designedbyanthony.com/*    →  308 → https://accounts.vertaflow.io/*
lighthouse.designedbyanthony.com/*  →  same app by default; or $LIGHTHOUSE_UPSTREAM_URL/* if set
* (everything else)                 →  this Next app (fallthrough)
```

### Optional env on the Netlify site

| Name                      | When needed                                              |
| ------------------------- | -------------------------------------------------------- |
| `LIGHTHOUSE_UPSTREAM_URL` | Only if `lighthouse.*` should hit a **different** deploy |

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
