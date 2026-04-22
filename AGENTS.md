# AGENTS.md — Designed by Anthony monorepo

## Architectural Guardrails
- **Root-Only Execution:** All builds and installs must run from the root `./`.
- **Git-to-Vercel Only:** NEVER deploy directly to Vercel. All deployments flow through Git → GitHub → Vercel auto-deploy. No `vercel deploy`, no `vercel --prod`, no manual uploads. If code isn't on `main`, it doesn't ship.
- **Lockfile Integrity:** After ANY change to `package.json` (root or workspace), you MUST run `pnpm install` and commit the updated `pnpm-lock.yaml` in the **same commit**. Verify with `pnpm install --frozen-lockfile` before pushing. A lockfile mismatch is a build-breaking bug — treat it as P0.

## Infrastructure Context
- **Routing:** Handled by root `middleware.ts`.
- **Apps:**
  - `designedbyanthony.com` -> `apps/marketing` (studio marketing)
  - `lighthouse.designedbyanthony.com` -> `apps/lighthouse` (Lighthouse SEO audit tool)

## Code Quality & Purge Rules
- **Search Before Write:** Before adding a feature, check if a legacy or duplicate implementation exists. If it does, delete it first.
- **Cleanup Duty:** After every feature completion, search for and remove unused imports and `console.log` statements.
- **Strict Typing:** No `any`. Use Zod for schema validation on all API inputs.

## Communication Preferences
- **Conciseness:** Keep responses under 1000 characters.
- **Progress Tracking:** Always update `STATUS.md` after a major task.
- **Error Handling:** If a build fails, do not ask for permission to fix it. Analyze the log, fix the code, and retry.

## Definition of Done
A task is only **Done** when all three are true:
1. It passes `pnpm turbo build` (a.k.a. `pnpm build`) from the repo root with zero errors.
2. It has been audited by BugBot (self-review pass: no `any`, no stray `console.log`, no unused imports).
3. The logo / branding renders **unbroken** on every affected surface — `/brand/logo.png` and `/brand/mark.webp` resolve, `@dba/theme` tokens are intact, and no subdomain is serving a fallback mark.

---

## Repo orientation

This file orients coding agents to the repo as a whole. Per-app specifics live in each app's own `AGENTS.md` (linked below). Always defer to those for app-local rules (build commands, test layouts, framework caveats).

### Repo layout

Turborepo + pnpm workspaces. Node `>=22.12.0`, pnpm `10.12.1` (pinned via `packageManager`).

```
/                    # apex Vercel project (Astro marketing) + root middleware
├── middleware.ts    # Vercel Routing Middleware "Chameleon" host-based router
├── turbo.json       # pipeline + globalEnv/globalDependencies
├── apps/
│   ├── marketing/   # Astro v6 — designedbyanthony.com (apex + www)
│   └── lighthouse/  # Next.js 16 — lighthouse.* (audit tool)
└── packages/
    ├── dba-theme/           # @dba/theme — global CSS tokens + brand assets
    └── lead-form-contract/  # @dba/lead-form-contract — shared lead payload schema
```

Per-app agent rules (read these before editing inside an app):

- `apps/marketing/AGENTS.md` — Astro site, Playwright projects, IndexNow, static parity headers for E2E, Spotlight gotcha.
- `apps/lighthouse/AGENTS.md` — Next.js 16 (read `node_modules/next/dist/docs/` before coding; APIs differ from training data).

Operator playbook with deployment + env notes: `ANTHONYS_INSTRUCTIONS.txt` and `README.md`.

### Common commands (run from repo root)

```bash
corepack enable && pnpm install   # first-time setup

pnpm build                         # turbo run build (all apps + packages)
pnpm lint                          # turbo run lint
pnpm dev:marketing                 # Astro on :4321
pnpm dev:lighthouse                # Lighthouse (Next) on :3100

pnpm test:e2e                      # marketing + lighthouse Playwright
pnpm test:e2e:marketing            # individually
pnpm test:e2e:lighthouse
```

Use `pnpm --filter <pkg-name>` to scope a command to a single workspace (e.g. `pnpm --filter dba-lighthouse-audit run lint`).

### Host-based routing — Vercel Routing Middleware

Root `middleware.ts` is Vercel Routing Middleware that runs on the apex (marketing) Vercel project and rewrites by `Host`.

- `admin.designedbyanthony.com/*` → **308** → `https://admin.vertaflow.io/*`
- `accounts.designedbyanthony.com/*` → **308** → `https://accounts.vertaflow.io/*`
- `lighthouse.designedbyanthony.com/*` → `$LIGHTHOUSE_UPSTREAM_URL/*` (lighthouse)
- everything else → Astro marketing (fallthrough via `next()`)

### Theme + brand (single source of truth)

- Canonical CSS tokens: `apps/marketing/src/styles/theme.css` (`:root { ... }`).
- Mirrored for Next.js + Tailwind in `packages/dba-theme/tokens.css`.
- Re-exported via `@dba/theme` (`packages/dba-theme/dba-global.css`).
- Brand assets (logo/mark) live in `packages/dba-theme/brand/` and each app keeps a mirror at `public/brand/*` so `/brand/logo.png` and `/brand/mark.webp` resolve from any subdomain.

When changing tokens: edit `apps/marketing/src/styles/theme.css` **and** update `packages/dba-theme/tokens.css` to match (same variable names + values). Brand verification is part of **Definition of Done**.

### Vercel deploy model

Two Vercel projects pointing at this repo, each with a different Root Directory:

- `apps/marketing` — apex project; also serves the root `middleware.ts`.
- `apps/lighthouse` — lighthouse.

Apex project requires `LIGHTHOUSE_UPSTREAM_URL` (also declared in `turbo.json` → `globalEnv`). All other secrets are per-app.

### Cursor Cloud specific instructions

- The cloud agent VM ships with pnpm + Node 22; run `pnpm install` at the repo root before any build/test if `node_modules` is missing.
- Per-app `AGENTS.md` files contain additional Cursor-Cloud-specific testing notes.
- Branch + PR conventions for cloud agents: create branches as `cursor/<descriptive-name>-<suffix>`, commit small logical changes, and open a PR per branch.
