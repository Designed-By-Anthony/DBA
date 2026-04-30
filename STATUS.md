# Migration Status Report

> **Note:** This file tracks migration and release notes for the **Turborepo Cloudflare** app (`apps/web` Next.js Pages + `apps/api` Elysia Worker, `bun`, `bun.lock`). Older single-app / Astro-era detail is archived below for context — see [README.md](README.md) and [AGENTS.md](AGENTS.md).

## Global UI rebuild foundation (2026-04-30)

- Rebuilt the public marketing and Lighthouse UI around global CSS tokens in `apps/web/src/styles/theme.css`, with `apps/web/src/design-system/tokens.css` resynced from the same `:root` block.
- Removed the old Framer Motion/GSAP UI layer and deleted unused motion/reveal helper components and scripts.
- Consolidated page-specific CSS into the global theme surface, preserving brand assets at `/brand/logo.png` and `/brand/mark.webp`.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build` pass from the repo root.

## Codebase cleanup, perf optimization & tech integrations (2026-04-30)

- Tightened the shared marketing chrome for responsive navigation across tablet/desktop/mobile by updating `apps/web/src/components/brand/BrandHeader.tsx` and `apps/web/src/components/marketing/MarketingChrome.tsx`.
- Desktop navigation now switches on at `md`, the mobile trigger stays isolated below `md`, and the mobile menu now renders as a true full-viewport opaque overlay with a dedicated header bar and centered link stack.
- Verified route blast radius: marketing routes under `apps/web/src/app/(site)` continue to inherit `MarketingChrome`, and `/tools` now adds an explicit `max-w-7xl` wrapper in `apps/web/src/app/(site)/tools/page.tsx` so it no longer bypasses the tightened container structure.
- Validation: `bun run typecheck` passes. Root `bun run lint` is still blocked by a pre-existing Biome formatting issue in `apps/web/src/components/JsonLd.tsx`, and `bun run build` is blocked in this sandbox by external font fetch failures to `fonts.googleapis.com`.

- Removed Zustand badge from the "Our Edge" stack display — dependency was previously removed but badge remained.
- Removed stray `console.warn` in the competitor-scan catch block of `apps/api/src/routes/audit.ts`.
- Cleaned up outdated Firebase/Firestore references in `lighthouse2.md` (now reflects Cloudflare Pages/Workers + KV/D1).
- Added `manifest.webmanifest` to `apps/web/public/` with PWA metadata — triggers PWA detection on Wappalyzer/BuiltWith.
- Added JSON-LD structured data (`Organization`, `LocalBusiness`, `WebSite`) in root layout — zero render cost, boosts SEO.
- Verification: `bun run lint`, `bun run build` pass from the repo root.

## Lockfile fix + backend PDF offload (2026-04-30)


- **Lockfile fix (P0):** Removed conflicting workspace-level `overrides` from `apps/web/package.json` (stale `postcss ^8.4.38` vs root `^8.5.12`, duplicate `uuid`, unrecorded `yaml@<2.8.3`). Moved `yaml@<2.8.3` override to root `package.json`. Regenerated `bun.lock` — `bun install --frozen-lockfile` now passes in CI.
- **Dependency hygiene:** Relocated heavy backend-only packages (`@google/genai`, `googleapis`, `cheerio`, `jspdf`) from `apps/web` to `packages/shared` where they are actually imported. Frontend bundle no longer ships these libraries.
- **PDF offload to API Worker:** Created `GET /api/report/:id/pdf` on the ElysiaJS Worker (`apps/api/src/routes/reportPdf.ts`). The route fetches the persisted report from the KV store, calls `buildAuditPdf` server-side, and streams the PDF back with `Content-Disposition: attachment`. `AuditResults.tsx` now fetches from this endpoint instead of importing `jspdf` client-side — removes ~250 KB from the browser bundle and eliminates client-side PDF generation latency.
- Added `./lighthouse/*` export to `packages/shared` so `AuditData` types are accessible from any workspace.
- Verification: `bun install --frozen-lockfile`, `bun run build`, `bun run typecheck`, and `bun run lint` pass from the repo root.
## Micro SaaS store /tools page build-out (2026-04-30)

- Replaced the "Coming Soon" waitlist on `/tools` with a full product catalog showcasing 6 Stripe-backed micro-SaaS products: SiteScan, ReviewPilot, ClientHub, LocalRank, TestiFlow, and ContentMill.
- Each product card displays 3 pricing tiers with a monthly/annual billing toggle (annual billing = 2 months free).
- Promo banners for FOUNDING50 (50% off forever, first 20 per product) and BOGO50 (50% off second tool).
- Quick-nav pill links for jumping between products; bottom CTA section summarizing stacking strategy.
- Created `apps/web/src/data/tools-products.ts` as the single source of truth for product data, tiers, pricing, and Stripe Payment Link URLs (placeholder until Viktor delivers final links).
- Removed unused zustand dependency and waitlist store (`useToolsStore`) — tools page is now a pure client component with local `useState` for billing toggle.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build` pass from the repo root.

## Cloudflare Worker eval fix + local audit cleanup (2026-04-29)

- Disabled Elysia AOT/code generation on the API root app and nested route modules so Cloudflare Workers no longer hit `EvalError: Code generation from strings disallowed for this context`.
- Added lightweight API Worker smoke routes: `/` and `/health` return `{ ok: true, service: "dba-api" }`; `/favicon.ico` returns an explicit null-body 204 so browser/favicon probes do not show Worker 500s.
- Local frontend API calls now default to same-origin `/api/*` in non-production, using the Next.js dev rewrite to `http://localhost:8787`; production still defaults to `https://api.designedbyanthony.com` unless `NEXT_PUBLIC_API_BASE_URL` is set.
- Cleaned the pasted dev-console warnings by adding `data-scroll-behavior="smooth"` to the root `<html>` and explicit auto sizing to brand mark `<Image>` instances touched by CSS.
- Cloudflare PR preview logs showed the dashboard command running `bun x turbo run build --filter=@dba/web` without a dependency install; added a web build preflight that runs `bun install --frozen-lockfile` from the repo root only when required workspace bins are absent.
- Cloudflare preview runtime logs then showed OpenNext failing against Turbopack output (`ComponentMod.handler is not a function` / `app-page-turbo.runtime.prod.js`); production `next build` now explicitly uses `--webpack` until the Cloudflare adapter supports this Next/Turbopack output, with font URLs adjusted for webpack CSS module resolution.
- Reproduced the remaining hosted 500 with Wrangler 3.101 (Cloudflare's current Git upload runtime) and materialized OpenNext prerender cache files into the Pages output so static app routes are served by Pages assets before the incompatible server function path.
- Added a generated-bundle whitespace trim step after `esbuild` so `apps/web/public/scripts/site.js` stays `git diff --check` clean even when bundled dependency internals contain padded template literals.
- Verification: `bun install --frozen-lockfile`, `bun run build`, `bun run typecheck`, `bun run lint`, and `bun audit` pass from the repo root. Wrangler API smoke checks return 200 for `/`, 204 for `/favicon.ico`, and 204 CORS preflight for `/api/audit`. Browser pass on `http://localhost:3000/lighthouse` reports no relevant warning/error logs for `mark.webp`, scroll behavior, DNS, or favicon. Brand assets resolve locally and exist in the Pages output at `/brand/logo.png`, `/brand/mark.webp`, and `/favicon.ico`.

## Pages frontend + Worker API decoupling rollout (2026-04-29)

- Cloudflare Pages **deploy command** must stay **empty** (or a no-op): **`wrangler versions upload`** targets standalone Workers and fails with “Missing entry-point”; Pages uploads `_worker.js` from `pages_build_output_dir` after build.
- Added root `wrangler.json` as the canonical Git-connected Cloudflare Pages config for monorepo root deploys: `pages_build_output_dir = "apps/web/.vercel/output/static"` plus `nodejs_compat`. This removes the dashboard ambiguity that can build successfully but run the deployed `_worker.js` without the required compatibility flag, causing 500s on `/` and `/favicon.ico`.
- Added `.nvmrc` (`24 LTS`) and tightened README/operator docs to use repo root **`.`**, build command `bun install --frozen-lockfile && bun x turbo run build --filter=@dba/web`, output `apps/web/.vercel/output/static`, and an empty deploy command.
- Runtime smoke test: rebuilt from the repo root, served `apps/web/.vercel/output/static` with `wrangler pages dev`, and confirmed 200 for `/`, `/lighthouse`, `/favicon.ico`, `/brand/logo.png`, and `/brand/mark.webp`.

- Added root `packageManager` metadata to unblock Turbo workspace resolution in Bun/CI.
- Switched `apps/web` default deploy path to Cloudflare Pages (`deploy:pages`) while keeping a Worker fallback script (`deploy:worker`).
- Added `apps/web/build/prepare-pages-bundle.mjs` to copy the **full** `.open-next` tree into `.vercel/output/static`, rename `worker.js` → `_worker.js`, and strip files over **25 MiB** so Wrangler resolves `./cloudflare/*`, `./middleware/*`, `./server-functions/*`, and `./.build/*` next to `_worker.js` (copying only `assets/` previously broke Pages deploy).
- Hardened frontend/backend boundary by requiring `NEXT_PUBLIC_API_BASE_URL` during production web env validation.
- Tightened browser-origin trust rules to apex + Cloudflare Pages previews (`*.pages.dev`) + localhost dev and reused this shared logic in API CORS setup.
- Updated operator docs (`README.md`, `.env.example`, `AGENTS.md`, `ANTHONYS_INSTRUCTIONS.txt`) to document Pages (frontend) + Worker (backend) architecture.

---

> Older entries have been archived to [STATUS_ARCHIVE.md](STATUS_ARCHIVE.md).
