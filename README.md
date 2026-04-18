# DBASTUDIO315

Designed by Anthony — monorepo (Agency OS, Lighthouse, marketing, packages).

## Apps

| App             | Path                | Framework | Hostname                                    |
| --------------- | ------------------- | --------- | ------------------------------------------- |
| Marketing site  | `apps/marketing`    | Astro     | `designedbyanthony.com` (apex + `www`)      |
| Agency OS (CRM) | `apps/web-viewer`   | Next.js   | `admin.designedbyanthony.com`, `accounts.…` |
| Lighthouse      | `apps/lighthouse`   | Next.js   | `lighthouse.designedbyanthony.com`          |

## Host-based routing — Vercel Routing Middleware

The root [`middleware.ts`](./middleware.ts) is **Vercel Routing Middleware** for the apex Astro project. Current Next.js apps use `proxy.ts`; this root file is different platform middleware that Vercel still expects to be named `middleware.ts`. It reads the `Host` header on the apex deployment and rewrites traffic to the correct upstream Vercel project.

```
admin.designedbyanthony.com/*       →  $ADMIN_UPSTREAM_URL/admin/*       (apps/web-viewer)
accounts.designedbyanthony.com/*    →  $ACCOUNTS_UPSTREAM_URL/portal/*   (apps/web-viewer)
lighthouse.designedbyanthony.com/*  →  $LIGHTHOUSE_UPSTREAM_URL/*        (apps/lighthouse)
* (everything else)                 →  apps/marketing (Astro, fallthrough)
```

The matcher only excludes `_vercel`. App subdomain assets like `/_next/static/*`, `/manifest.webmanifest`, `/serwist/*`, and `/brand/*` must pass through the gateway so they resolve from the same upstream project as the HTML.

### Required env vars on the apex Vercel project

Set these on the Vercel project whose **Root Directory** is the repo root (the apex marketing deployment). They are also declared in `turbo.json` under `globalEnv`.

| Name                      | Example                                                   |
| ------------------------- | --------------------------------------------------------- |
| `ADMIN_UPSTREAM_URL`      | `https://agency-os.vercel.app`                            |
| `ACCOUNTS_UPSTREAM_URL`   | `https://agency-os.vercel.app` (reuses web-viewer)        |
| `LIGHTHOUSE_UPSTREAM_URL` | `https://lighthouse-audit.vercel.app`                     |

If an upstream URL is unset in production, the middleware returns a loud `502` instead of silently serving the Astro site from an app subdomain. Preview/local builds still fall through for easier development.

### Why not `vercel.json` rewrites?

`vercel.json` rewrites run **before** middleware and are static JSON. Once the rules grew past "swap these paths" (plan-suite gating, tenant skins, feature flags), Routing Middleware became the right place because it lets us express the logic in typed TypeScript. The current `vercel.json` intentionally contains only the framework/build/output config so it never conflicts with the middleware.

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
