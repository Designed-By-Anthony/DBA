# Security policy

This document describes the security posture of the **ANTHONY.** site: a **Turborepo monorepo** deployed on **Cloudflare Pages** (Next.js frontend) and a **Cloudflare Worker** (ElysiaJS API), built from **GitHub**.

## Reporting a vulnerability

Email **anthony@designedbyanthony.com** with:

- A description of the issue.
- Reproduction steps (URL, payload, expected vs. actual behavior).
- Your assessment of severity.

Do **not** file public issues for undisclosed security findings. Do **not** post proofs-of-concept that exercise real customer data.

Acknowledgement target: within 3 business days. Fix target: HIGH/CRITICAL within 7 days; MEDIUM within 30 days; LOW at the next planned release.

## Supported versions

Security fixes land on **`main`** and deploy through the normal Cloudflare Pages + Workers CI pipeline. There is no separate long-lived release branch.

## Scope (this repository)

| Surface | Role |
|---------|------|
| Marketing routes | Public content under `apps/web/src/app/(site)/` |
| Lighthouse segment | `apps/web/src/app/lighthouse/` |
| API Worker | `apps/api/src/routes/` (audit, report, report-pdf, lead-email, audit-email-summary, report-email, test-emails) |
| Request routing | `apps/web/src/middleware.ts` (host-based redirects) |
| Shared logic | `packages/shared/src/` (origins, rate limiting, report-store) |

**The Vault** (admin console, client accounts, CRM) is **not** implemented in this repo: `admin.designedbyanthony.com` and `accounts.designedbyanthony.com` are redirected in the Next.js middleware to the managed **vertaflow.io** infrastructure host. Do not assume this tree contains Clerk, Stripe webhooks, or portal session code unless those files exist under `apps/`.

## Trust boundaries (what this app enforces)

- **Turnstile** on public POST surfaces when `TURNSTILE_SECRET_KEY` is set and the client sends a token (e.g. lead-email). **Audit** verifies Turnstile only when **`LIGHTHOUSE_STRICT_TURNSTILE=1`**; otherwise the audit API relies on rate limiting and validation.
- **CORS** on the API Worker: the global `@elysiajs/cors` plugin in `apps/api/src/index.ts` validates the `Origin` header against `isTrustedMarketingBrowserOrigin()` (apex, subdomains, `*.pages.dev` previews, and localhost dev ports).
- **Audit abuse:** sliding-window **per-IP** limiting in `packages/shared/src/lighthouse/lib/http.ts` (`checkLocalRateLimit` — process-local; not a substitute for edge or shared-store rate limiting at scale).
- **Secrets:** production configuration lives in the **Cloudflare dashboard** (Worker environment variables / secrets). Schema and optional strictness are documented in `apps/web/src/lib/env/` and `.env.example`.

## Operational hygiene

- Run **`bun audit`** before releases; treat HIGH/CRITICAL advisories as release blockers unless explicitly risk-accepted.
- **Do not** commit real API keys, webhook secrets, or service-account JSON; rotate anything that has ever appeared in git history.
- After CSP or connect-src changes, run **`bun run --cwd apps/web sync:static-headers`** so `static-headers.json` stays aligned with `build/csp.mjs`.

## Where defenses live in code

| Concern | Location |
|---------|----------|
| Host-based redirects (admin / accounts) | `apps/web/src/middleware.ts` |
| CORS (global, origin-validated) | `apps/api/src/index.ts` (Elysia `cors` plugin) |
| Trusted origin allowlist | `packages/shared/src/lib/marketingBrowserOrigins.ts` |
| Audit pipeline + rate limit | `apps/api/src/routes/audit.ts`, `packages/shared/src/lighthouse/lib/http.ts` |
| Resend lead-email bridge (honeypot) | `apps/api/src/routes/leadEmail.ts` |
| CSP + security headers | `apps/web/next.config.ts`, `apps/web/build/csp.mjs` |
| Env validation (Zod) | `apps/web/src/lib/env/` |

## Audit log for this document

| Date | Change |
|------|--------|
| 2026-04-16 | Initial SECURITY.md |
| 2026-04-27 | Rewrote for single Next.js + Netlify; removed references to paths and products not in this repository |
| 2026-04-30 | Rewrote for Cloudflare Pages + Workers monorepo architecture; updated all paths to reflect `apps/web`, `apps/api`, and `packages/shared` |
