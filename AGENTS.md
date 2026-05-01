# AGENTS.md — ANTHONY.

## Architectural Guardrails
- **Root-Only Execution:** All builds and installs run from the repo root (`./`) via Turbo.
- **GitHub + CI Only:** NEVER deploy manually outside the hosted CI path. Production rolls out from **GitHub** (Cloudflare Pages + Workers). If code isn't on `main`, it doesn't ship to production.
- **Lockfile Integrity:** After ANY change to `package.json` (root or any workspace), run `bun install` and commit the updated `bun.lock` in the **same commit**. A lockfile mismatch is a build-breaking bug — treat it as P0.

## Infrastructure Context

**Always two deploy targets:** (1) **Cloudflare Pages** = Next.js app in **`apps/web`** (OpenNext bundle + `_worker.js`). (2) **Cloudflare Worker** = Elysia API in **`apps/api`** (script **`dba-api`**), **not** part of the Pages build — deploy separately and attach **`api.designedbyanthony.com`** to that Worker.

- **Routing (apex):** Handled by `apps/web/src/middleware.ts` on the Cloudflare Pages edge runtime.
- **Public web:** Next.js app at `apps/web/` — apex + `www`. Lighthouse audit lives at `/lighthouse`.
- **API:** ElysiaJS Cloudflare Worker at `apps/api/` — `api.designedbyanthony.com`.
- **Shared code:** `packages/shared` (`@dba/shared`) — lighthouse business logic + shared lib helpers.

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
1. It passes `bun run build` from the repo root with zero errors.
2. It has been audited by BugBot (self-review pass: no `any`, no stray `console.log`, no unused imports).
3. The logo / branding renders **unbroken** on every affected surface — `/brand/logo.png` and `/brand/mark.webp` resolve, design-system tokens are intact, and no subdomain is serving a fallback mark.

---

## Repo orientation

**Turborepo monorepo.** Bun `>=1.1.0`, Node `>=24.11.0` (lockfile: `bun.lock`).

```
/                               # monorepo root
├── apps/
│   ├── web/                    # Next.js 16 (designedbyanthony.com)
│   │   ├── src/
│   │   │   ├── app/            # App Router (marketing + /lighthouse)
│   │   │   ├── lighthouse/     # Audit UI + auditReport types (@lh/*)
│   │   │   ├── design-system/  # tokens, brand, dba-global.css
│   │   │   └── lib/            # env validation, re-exports from @dba/shared
│   │   ├── build/              # CSP + sync-static-headers
│   │   ├── public/
│   │   └── wrangler.json      # opennextjs-cloudflare (build artifact source for Pages bundle)
│   └── api/                    # ElysiaJS Worker (api.designedbyanthony.com)
│       ├── src/routes/         # 6 Elysia routes (/api/audit, /api/report, etc.)
│       └── wrangler.json
├── packages/
│   └── shared/                 # @dba/shared — shared between web + api
│       └── src/
│           ├── lighthouse/lib/ # ai, gmail, http, places, report-store, ...
│           └── lib/            # lead-form-contract, leadWebhook, marketingBrowserOrigins
├── turbo.json
└── biome.json
```

Operator playbook: `ANTHONYS_INSTRUCTIONS.txt` and `README.md`.

### Common commands

```bash
bun install           # first-time setup

bun run dev           # turbo: Next dev (:3000) + Wrangler API (:8787) in parallel
bun run dev:web       # Next.js only
bun run dev:api       # ElysiaJS Wrangler only
bun run build         # turbo: full production build
bun run typecheck     # turbo: tsc --noEmit across all packages
bun run lint          # Biome (root — applies to all packages)
bun run test:e2e      # Cypress (see cypress.config.ts)
```

### Host-based routing — Next.js middleware

`apps/web/src/middleware.ts` branches on `Host`.

- `admin.designedbyanthony.com/*` → **308** → `https://admin.vertaflow.io/*` (The Vault / managed console)
- `accounts.designedbyanthony.com/*` → **308** → `https://accounts.vertaflow.io/*` (client portal)
- everything else (including `/lighthouse`) → normal Next.js handling

### Theme + brand (single source of truth)

- Canonical CSS tokens: `apps/web/src/styles/theme.css` (`:root { ... }`).
- Tailwind bridge + mirrored variables: `apps/web/src/design-system/tokens.css`, `apps/web/src/design-system/tailwind-v4-bridge.css`.
- App entry: `apps/web/src/design-system/dba-global.css` (imports `src/styles/theme.css`).
- Brand assets: `apps/web/public/brand/*` (and `apps/web/src/design-system/brand.ts` for paths in code).

When changing tokens: edit `apps/web/src/styles/theme.css` and keep `apps/web/src/design-system/tokens.css` aligned (same variable names + values). Brand verification is part of **Definition of Done**.

### Cloudflare Pages + Workers

- **Web (Pages):** `apps/web/wrangler.json` + `apps/web/build/prepare-pages-bundle.mjs` — OpenNext builds worker/assets, then deploys via `wrangler pages deploy`.
- **Pages deploy command must be empty** — do **not** use **`wrangler versions upload`** on the Pages project (that targets standalone Workers and errors with “Missing entry-point”). Pages publishes **`pages_build_output_dir`** (`.vercel/output/static` with `_worker.js`) after the build.
- **Output path:** If the Pages **root directory** is the **repo root**, set **Build output** to **`apps/web/.vercel/output/static`**. If the root is **`apps/web`**, use **`.vercel/output/static`**.
- **API Worker:** `apps/api/wrangler.json` — script name **`dba-api`**; deploy with **`wrangler deploy`** from `apps/api`, not via the Pages pipeline (use **`wrangler versions upload`** only if you intentionally ship that Worker from CI with an explicit entry config).
- **`apps/web/static-headers.json`:** Generated by `bun run --cwd apps/web sync:static-headers` from `apps/web/build/csp.mjs` — run after CSP edits.

### Cursor Cloud specific instructions

- Run `bun install` at the repo root before any build/test if `node_modules` is missing.
- Branch + PR conventions for cloud agents: create branches as `cursor/<descriptive-name>-<suffix>`, commit small logical changes, and open a PR per branch.
