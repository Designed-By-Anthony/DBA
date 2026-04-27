# Security policy

This document describes the security posture of the Designed by Anthony Next.js app and related operational obligations.

## Reporting a vulnerability

Email **anthony@designedbyanthony.com** with:

- A description of the issue.
- Reproduction steps (URL, payload, expected vs. actual behavior).
- Your assessment of severity.

Do **not** file public GitHub issues for security findings. Do **not** post proofs-of-concept that exercise real customer data.

Acknowledgement target: within 3 business days. Fix target: HIGH/CRITICAL within 7 days; MEDIUM within 30 days; LOW at the next planned release.

## Supported versions

Only `main` and the currently deployed Vercel commits are supported. There is no release branch model — security fixes land on `main`, deploy, and that's the new baseline.

## Threat model (abbreviated)

This repository ships the **public marketing + Lighthouse** Next.js surface on Vercel. Other products (e.g. Agency OS / web viewer) may live in separate repos; references below to `apps/web-viewer` describe that product’s layout when present in a combined workspace.

| App | Audience | Auth |
|---|---|---|
| This repo — marketing + Lighthouse (Next on Vercel) | Anonymous public; audit UI/API on same app | Turnstile where enabled; per-IP rate limit on audit routes |
| Agency OS / web viewer (if applicable) | Tenant admins + portal clients | Clerk sessions for admins; `portal_session` cookie (hashed token) for clients |

Trust boundaries the code must honor:

- **Tenant isolation.** Every admin query and every CRM mutation is scoped by `tenantId = clerkOrgId`. Portal queries scope by `(tenantId, prospectId)` from the server-side session, never by body-supplied identifiers.
- **Webhook authenticity.** Stripe signs via `stripe-signature`. Clerk signs via Svix headers. Calendly signs via `Calendly-Webhook-Signature` (HMAC-SHA256 of `"${ts}.${rawBody}"`, tolerated for 5 min). Custom agentic / IDX / lead webhooks require a shared secret sent in `Authorization: Bearer` or `x-webhook-secret`. Every verified webhook route fails **closed** when its secret env var is unset.
- **Never leak tokens.** Magic-link / portal-session tokens are hashed (SHA-256) at rest. They are returned to the caller in the HTTP response **only** when the server-only `IS_TEST=true` env var is active and the deploy is not prod (enforced in `src/lib/test-mode.ts`). There is no request-header escape hatch.

## Operational obligations (what keeps this secure)

### Vercel environment variables — required

Production deployments refuse to start or fail closed at runtime when these are missing.

| Env var | Used by | Behavior if missing in prod |
|---|---|---|
| `CLERK_SECRET_KEY` | admin session validation | admin routes 503 |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` | webhook 503 |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | `/api/webhooks/calendly` | webhook 503 |
| `LEAD_WEBHOOK_SECRET` | `/api/webhooks/lead` | webhook 401 |
| `EMAIL_LINK_SIGNING_SECRET` | email click-tracking signing | `wrapLinksForTracking` throws |
| `TURNSTILE_SECRET_KEY` | `/api/lead` (public lead ingest) | 503 (unless `PUBLIC_LEAD_INGEST_ALLOW_NO_TURNSTILE=true`) |
| `CRON_SECRET` | `/api/cron/*` | cron routes 503 |
| `DATABASE_URL` | data plane | runtime errors |
| `RESEND_API_KEY` | transactional email | emails silently skipped (best-effort) |

### Vercel environment variables — optional, fail-open by design

| Env var | Purpose |
|---|---|
| `AGENTIC_WEBHOOK_SECRET` | enables `/api/webhooks/agentic`; unset = route returns 503 |
| `IDX_WEBHOOK_SECRET` | enables `/api/webhooks/idx`; unset = route returns 503 |
| `ADMIN_ALLOWED_ORG_IDS`, `ADMIN_ALLOWED_USER_IDS` | apex-operator allowlist; unset = no one can access the guarded route |

### Vercel environment variables — deliberately avoided

- **Do not set** `IS_TEST=true` in the production environment. The helper in `src/lib/test-mode.ts` refuses to honor it when `VERCEL_ENV === 'production'`, but leaving it off prod entirely is cheaper than relying on the guard.
- **Do not set** `NEXT_PUBLIC_IS_TEST`. It was removed. Any `NEXT_PUBLIC_*` variable is inlined into the client bundle at build time; putting security logic behind it is structurally unsafe.
- **Do not set** `PUBLIC_LEAD_INGEST_ALLOW_NO_TURNSTILE=true` in production.

### Secret rotation — recurring

- **`EMAIL_LINK_SIGNING_SECRET`** — rotate whenever you rotate session secrets. Every outbound email-tracking URL is signed with this key; rotation invalidates old tracking links (desirable).
- **`STRIPE_WEBHOOK_SECRET`** — rotate from the Stripe dashboard annually or on any Stripe account compromise.
- **`CLERK_WEBHOOK_SIGNING_SECRET`** — rotate from Clerk dashboard on admin turnover.
- **Leaked secrets are never safe once committed.** The Google Chat webhook key+token was hard-coded in a fallback literal from PR #3 until its removal in PR #13; the only correct remediation was to revoke it in Google Workspace **and** purge it from git history (BFG / `git filter-repo`). Apply the same playbook to any future leak.

### Dependency hygiene

- Run `npm audit --omit=dev` before every release.
- HIGH/CRITICAL advisories block the release until patched or justified.
- MODERATE advisories on dev-only transitive deps may be tracked in an issue and patched on the next planned bump.

### Cookie / session lifecycle

- `portal_session`: `httpOnly`, `sameSite=strict`, `secure` on Vercel, 7-day expiry, hashed at rest. Users can invalidate via `POST /api/portal/logout`.
- Admin sessions: managed by Clerk. End-user control is via Clerk's user-menu Sign Out.
- There is no long-lived "remember me" token; portal re-auth requires a fresh magic link.

### Rate limits

Current process-local limits (sliding window, per Vercel function instance):

| Route | Limit |
|---|---|
| `POST /api/portal/magic-link` | 5 requests / 15 min per (IP + email) |
| `POST /api/lead` | 10 requests / min per IP |
| `POST /api/portal/tickets` | 10 requests / min per (tenantId + prospectId) |
| `POST /api/audit` (lighthouse) | 5 requests / 10 min per IP |

Upgrade path if abuse emerges: swap the in-memory counter in `src/lib/rate-limit.ts` for an Upstash / KV-backed store. Call sites do not change.

## Known-but-accepted risk

- **`AGENTIC_WEBHOOK_SECRET` / `IDX_WEBHOOK_SECRET` empty by default.** The routes are feature-flagged off via empty env; enabling them is an intentional op.
- **Shared Cloudflare zone (`CLOUDFLARE_ZONE_ID`).** There is currently no per-tenant zone model. The admin DNS / hostname routes that operated on this shared zone have been removed; re-introducing them requires either an allowlist gate (`assertApexOperator`) or a per-tenant zone mapping. Discussed in PR #24.
- **Process-local rate limits.** A multi-instance Vercel deploy has one bucket per instance. This is accepted — the limiter is defense in depth, not a primary control.

## Where defenses live in code

| Concern | File |
|---|---|
| Server-only test-mode gate | `apps/web-viewer/src/lib/test-mode.ts` |
| Webhook signature / shared-secret verification | `apps/web-viewer/src/lib/webhook-auth.ts` |
| Cron auth | `apps/web-viewer/src/lib/cron-auth.ts` |
| Email HTML escaping + safe-URL guard | `apps/web-viewer/src/lib/email-utils.ts` |
| Click-tracking HMAC sign/verify | `apps/web-viewer/src/lib/email-utils.ts` + `apps/web-viewer/src/app/api/track/click/[emailId]/route.ts` |
| Error-response hygiene | `apps/web-viewer/src/lib/api-error.ts` |
| Rate limiter | `apps/web-viewer/src/lib/rate-limit.ts` when present (plus `src/lighthouse/lib/http.ts` for audit routes in this repo) |
| Request body size limit | `apps/web-viewer/src/lib/body-limit.ts` |
| Portal session hash | `apps/web-viewer/src/lib/portal-auth.ts` |
| Apex-operator allowlist | `apps/web-viewer/src/lib/admin-allowlist.ts` |
| Postgres row-level security policies | `packages/database/sql/enable_rls.sql` |
| Security response headers | `next.config.ts` (CSP + baseline headers), `static-headers.json` (Playwright parity; CSP synced from `build/csp.mjs` via `npm run sync:static-headers`) |

## Audit log for this document

| Date | Change | PR |
|---|---|---|
| 2026-04-16 | Initial SECURITY.md, rollup of the 2026-04 security review | this PR |
