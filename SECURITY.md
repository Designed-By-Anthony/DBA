# Security policy

This document describes the security posture of the **Designed by Anthony** site: a **single Next.js 16** application at the repository root, deployed on **Netlify** (Git → GitLab → Netlify).

## Reporting a vulnerability

Email **anthony@designedbyanthony.com** with:

- A description of the issue.
- Reproduction steps (URL, payload, expected vs. actual behavior).
- Your assessment of severity.

Do **not** file public issues for undisclosed security findings. Do **not** post proofs-of-concept that exercise real customer data.

Acknowledgement target: within 3 business days. Fix target: HIGH/CRITICAL within 7 days; MEDIUM within 30 days; LOW at the next planned release.

## Supported versions

Security fixes land on **`main`** and deploy through the normal Netlify pipeline. There is no separate long-lived release branch.

## Scope (this repository)

| Surface | Role |
|--------|------|
| Marketing routes | Public content under `src/app/(site)/` |
| Lighthouse segment | `src/app/lighthouse/`, `src/lighthouse/*` |
| App Router API | `src/app/api/*` (contact, audit, lead-email, report, stream-chat-token, etc.) |
| Edge routing | `src/middleware.ts` (host-based redirects; optional `LIGHTHOUSE_UPSTREAM_URL`) |

**VertaFlow / Agency OS** (admin, accounts, CRM) is **not** implemented in this repo: `admin.designedbyanthony.com` and `accounts.designedbyanthony.com` are redirected to **vertaflow.io** in middleware. Do not assume this tree contains Clerk, Stripe webhooks, or portal session code unless those files exist under `src/`.

## Trust boundaries (what this app enforces)

- **Turnstile** on public POST surfaces that accept browser traffic (for example `/api/contact`, `/api/audit`, `/api/lead-email`) when `TURNSTILE_SECRET_KEY` is configured server-side and the matching site key is exposed to the client.
- **CORS** on `/api/contact`: responses only allow the Designed by Anthony origin family (see `src/app/api/contact/route.ts`), not arbitrary `*`.
- **Audit abuse:** sliding-window **per-IP** limiting for `POST /api/audit` in `src/lighthouse/lib/http.ts` (`checkLocalRateLimit` — process-local; not a substitute for edge or shared-store rate limiting at scale).
- **Secrets:** production configuration lives in Netlify environment variables. Schema and optional strictness are documented in `src/lib/env/marketing.ts`, `src/lib/env/lighthouse.ts`, and `.env.example`.

## Operational hygiene

- Run **`npm audit --omit=dev`** before releases; treat HIGH/CRITICAL advisories as release blockers unless explicitly risk-accepted.
- **Do not** commit real API keys, webhook secrets, or service-account JSON; rotate anything that has ever appeared in git history.
- After CSP or connect-src changes, run **`npm run sync:static-headers`** so `static-headers.json` and `netlify.toml` stay aligned with `build/csp.mjs`.

## Where defenses live in code (this repo)

| Concern | Location |
|--------|----------|
| Host-based redirects (admin / accounts / lighthouse) | `src/middleware.ts` |
| Contact form CORS + Turnstile | `src/app/api/contact/route.ts` |
| Audit pipeline + rate limit + optional CRM / Freshworks hooks | `src/app/api/audit/route.ts`, `src/lighthouse/lib/http.ts` |
| Resend lead-email bridge (Turnstile + honeypot) | `src/app/api/lead-email/route.ts` |
| Stream Chat token issuance | `src/app/api/stream-chat-token/route.ts` |
| CSP + security headers | `next.config.ts`, `build/csp.mjs` |
| Env validation (Zod) | `src/lib/env/marketing.ts`, `src/lib/env/lighthouse.ts`, `src/lib/env/shared.ts` |

## Audit log for this document

| Date | Change |
|------|--------|
| 2026-04-16 | Initial SECURITY.md |
| 2026-04-27 | Rewrote for single Next.js + Netlify; removed references to paths and products not in this repository |
