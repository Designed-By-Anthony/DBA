# AGENTS.md — Designed by Anthony

## Architectural Guardrails
- **Root-Only Execution:** All builds and installs run from the repo root (`./`).
- **Git-to-Vercel Only:** NEVER deploy directly to Vercel. All deployments flow through Git → GitHub → Vercel auto-deploy. No `vercel deploy`, no `vercel --prod`, no manual uploads. If code isn't on `main`, it doesn't ship.
- **Lockfile Integrity:** After ANY change to `package.json`, run `npm install` and commit the updated `package-lock.json` in the **same commit**. Verify with `npm ci` before pushing. A lockfile mismatch is a build-breaking bug — treat it as P0.

## Infrastructure Context
- **Routing (apex):** Handled by `src/middleware.ts` on the Vercel project.
- **Public web:** Single Next.js app — apex + `www` + Lighthouse segment on `lighthouse.*` and `/lighthouse/*`.

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
1. It passes `npm run build` from the repo root with zero errors.
2. It has been audited by BugBot (self-review pass: no `any`, no stray `console.log`, no unused imports).
3. The logo / branding renders **unbroken** on every affected surface — `/brand/logo.png` and `/brand/mark.webp` resolve, design-system tokens are intact, and no subdomain is serving a fallback mark.

---

## Repo orientation

Single **Next.js 16** app at the repository root. Node `>=22.12.0`, **npm** (lockfile: `package-lock.json`).

```
/                          # Next.js app root
├── src/
│   ├── app/               # App Router (marketing + /lighthouse)
│   ├── lighthouse/        # Lighthouse audit UI + server libs (`@lh/*`)
│   ├── design-system/     # tokens, brand, dba-global.css
│   └── lib/               # env validation, lead contract, shared helpers
├── build/                 # CSP + sync-static-headers (vercel.json + static-headers.json)
├── public/
└── vercel.json
```

Operator playbook: `ANTHONYS_INSTRUCTIONS.txt` and `README.md`.

### Common commands

```bash
npm install           # first-time setup

npm run dev           # build site bundle, then Next dev server (:3000)
npm run build         # prebuild (site script + sync headers) + next build
npm run lint          # Biome
npm run test:e2e      # Cypress (see cypress.config.ts)
```

### Host-based routing — Next.js middleware

`src/middleware.ts` branches on `Host`.

- `admin.designedbyanthony.com/*` → **308** → `https://admin.vertaflow.io/*`
- `accounts.designedbyanthony.com/*` → **308** → `https://accounts.vertaflow.io/*`
- `lighthouse.designedbyanthony.com/*` → same app (in-app rewrites); if `LIGHTHOUSE_UPSTREAM_URL` is set, rewrite to that URL instead
- everything else → normal Next.js handling

### Theme + brand (single source of truth)

- Canonical CSS tokens: `src/styles/theme.css` (`:root { ... }`).
- Tailwind bridge + mirrored variables: `src/design-system/tokens.css`, `src/design-system/tailwind-v4-bridge.css`.
- App entry: `src/design-system/dba-global.css` (imports `src/styles/theme.css`).
- Brand assets: `public/brand/*` (and `src/design-system/brand.ts` for paths in code).

When changing tokens: edit `src/styles/theme.css` and keep `src/design-system/tokens.css` aligned (same variable names + values). Brand verification is part of **Definition of Done**.

### Vercel deploy model

- **Root Directory:** repository root (this Next.js app).
- Optional **`LIGHTHOUSE_UPSTREAM_URL`** on the apex project if `lighthouse.*` should proxy to another deployment.

### Cursor Cloud specific instructions

- Run `npm install` (or `npm ci`) at the repo root before any build/test if `node_modules` is missing.
- Branch + PR conventions for cloud agents: create branches as `cursor/<descriptive-name>-<suffix>`, commit small logical changes, and open a PR per branch.
