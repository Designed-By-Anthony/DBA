# DBASTUDIO315

Designed by Anthony — monorepo (Agency OS, Lighthouse, marketing, packages).

## Apps

| App             | Path                | Framework | Hostname                                    |
| --------------- | ------------------- | --------- | ------------------------------------------- |
| Marketing site  | `apps/marketing`    | Astro     | `designedbyanthony.com` (apex + `www`)      |
| Agency OS (CRM) | `apps/web-viewer`   | Next.js   | `admin.designedbyanthony.com`, `accounts.…` |
| Lighthouse      | `apps/lighthouse`   | Next.js   | `lighthouse.designedbyanthony.com`          |

## Host-based routing — `middleware.ts`

The root [`middleware.ts`](./middleware.ts) is a **Vercel Edge Middleware** that reads the `Host` header on the apex deployment and rewrites traffic to the correct upstream Vercel project. This is the "Chameleon" gateway — it keeps the routing rules in TypeScript so we can grow them (A/B, tenant skins, feature flags) without editing `vercel.json`.

```
admin.designedbyanthony.com/*       →  $ADMIN_UPSTREAM_URL/*            (apps/web-viewer)
accounts.designedbyanthony.com/*    →  $ACCOUNTS_UPSTREAM_URL/accounts/* (apps/web-viewer)
lighthouse.designedbyanthony.com/*  →  $LIGHTHOUSE_UPSTREAM_URL/*       (apps/lighthouse)
* (everything else)                 →  apps/marketing (Astro, fallthrough)
```

The matcher excludes `_next`, `_vercel`, `/brand`, `/images`, `/fonts`, `/scripts`, `/sitemap*`, and `/robots.txt` so asset requests never get mis-rewritten.

### Required env vars on the apex Vercel project

Set these on the Vercel project whose **Root Directory** is the repo root (the apex marketing deployment). They are also declared in `turbo.json` under `globalEnv`.

| Name                      | Example                                                   |
| ------------------------- | --------------------------------------------------------- |
| `ADMIN_UPSTREAM_URL`      | `https://agency-os.vercel.app`                            |
| `ACCOUNTS_UPSTREAM_URL`   | `https://agency-os.vercel.app` (reuses web-viewer)        |
| `LIGHTHOUSE_UPSTREAM_URL` | `https://lighthouse-audit.vercel.app`                     |

If an upstream URL is unset, the middleware falls through to the Astro site instead of serving a broken rewrite.

### Why not `vercel.json` rewrites?

`vercel.json` rewrites run **before** middleware and are static JSON. Once the rules grew past "swap these paths" (plan-suite gating, tenant skins, feature flags), Edge Middleware became the right place — it's still on the edge network but lets us express the logic in typed TypeScript. The current `vercel.json` intentionally contains only the framework/build/output config so it never conflicts with the middleware.

## Turborepo — root build fans out to all three apps

Running `pnpm turbo run build` (or just `pnpm build`) at the repo root builds:

1. `@dba/lead-form-contract`, `@dba/theme` (topologically first via `dependsOn: ["^build"]`)
2. `designed-by-anthony` (Astro), `agency-os` (Next.js), `lighthouse-audit` (Next.js) — in parallel

Cache keys include the root [`middleware.ts`](./middleware.ts), [`tsconfig.json`](./tsconfig.json), and [`vercel.json`](./vercel.json) (see `turbo.json` → `globalDependencies`) so a change to the gateway invalidates every app build.

### Per-app dev servers

```bash
pnpm dev:marketing     # Astro  → port 4321 (marketing)
pnpm dev:web           # Next   → port 3000 (Agency OS)
pnpm dev:lighthouse    # Next   → port 3100 (Lighthouse)
```

## Global theme + brand assets

- Tokens: `apps/marketing/src/styles/theme.css` (canonical) — mirrored in `packages/dba-theme/tokens.css` and re-exported via the `@dba/theme` package.
- Logos / mark: centralized in [`packages/dba-theme/brand/`](./packages/dba-theme/brand) and imported via `@dba/theme/brand`. Each app ships a mirror at `public/brand/*` so `/brand/logo.png` and `/brand/mark.webp` resolve from any subdomain.

See [`ANTHONYS_INSTRUCTIONS.txt`](./ANTHONYS_INSTRUCTIONS.txt) for the full operator playbook.
