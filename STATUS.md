# System Health Report (Golden Thread)

Date: 2026-04-16

## 1) Stripe → Clerk → Postgres handshake

- **Stripe checkout metadata includes `client_id` + `vertical_type`**: ✅
  - Implemented in `apps/web-viewer/src/lib/stripe.ts`
  - Implemented in `apps/web-viewer/src/components/portal/actions.ts`
  - Implemented in `apps/web-viewer/src/app/admin/billing/upgrade-actions.ts`
  - Keys:
    - `client_id` (`STRIPE_META_CLIENT_ID`) = Clerk org id
    - `vertical_type` (`STRIPE_META_VERTICAL_TYPE`) = Postgres `tenants.vertical` (fallback `agency`)

- **Stripe webhook captures `client_id` + `vertical_type` from metadata**: ✅
  - `apps/web-viewer/src/app/api/webhooks/stripe/route.ts`
  - Persists them onto invoice/activity records for traceability.

- **Payment triggers Clerk Organization creation**: ⚠️ Partial
  - Clerk org creation exists in CRM (`apps/web-viewer/src/app/admin/clients/actions.ts`), not in the Stripe webhook.
  - Stripe webhook currently records payment + updates Firestore CRM entities; it does not provision a Clerk org by itself.

- **Clerk `organization.created` writes tenant row to Postgres with correct `vertical_type` enum**: ✅
  - Webhook: `apps/web-viewer/src/app/api/webhooks/clerk/route.ts`
  - Vertical parsing: `apps/web-viewer/src/lib/tenant-metadata.ts` (`public_metadata.vertical` → `vertical_type`)
  - Org creation now sets `public_metadata.vertical` + `primaryColor`: `apps/web-viewer/src/app/admin/clients/actions.ts`

## 2) CRM “Skin” logic (Chameleon)

- **Admin layout selects vertical module via switch on `tenant.vertical`**: ✅
  - `apps/web-viewer/src/components/vertical/VerticalExperience.tsx`
  - `restaurant` → `KitchenDisplay`
  - `service_pro` → `JobEstimator`
  - `retail` → `RetailWorkbench`

- **Shared UI responds to DB primary color**: ✅ (CSS variable)
  - `VerticalExperience` sets `--tenant-accent` from `tenants.config.primaryColor`.
  - Any UI that uses `var(--tenant-accent)` will follow DB config.

## 3) Domain fulfillment

- **Cloudflare for SaaS `custom_hostnames` wired to “Add Domain” UI**: ✅
  - Cloudflare client: `apps/web-viewer/src/lib/cloudflare.ts`
  - Admin API: `apps/web-viewer/src/app/api/admin/custom-hostnames/route.ts`
  - UI: `apps/web-viewer/src/app/admin/domains/DomainsClient.tsx`

- **`admin.designedbyanthony.com` scoped via middleware**: ✅
  - `apps/web-viewer/src/proxy.ts` treats `admin.*` as `app.*` and protects/rewrites to `/admin/*`.

- **`accounts.designedbyanthony.com` scoped via middleware**: ❌ Not implemented in this app
  - No `accounts.*` routing/rewrites exist in `apps/web-viewer/src/proxy.ts`.

## 4) Green light check

- **Production build (turbo build)**: ✅
  - Verified green on 2026-04-16:
    - Command: `npx pnpm@10.12.1 -w turbo build`
    - Result: exit_code 0 (elapsed ~97s)
  - Build reliability hardening:
    - `apps/web-viewer/package.json` now runs `next build` with `NODE_OPTIONS=--max-old-space-size=8192` to prevent OOM.

- **Lint (turbo lint)**: ✅
  - Command: `npx pnpm@10.12.1 -w turbo lint`
  - Result: exit_code 0

- **E2E smoke (CI-safe)**: ✅
  - Command: `npx pnpm@10.12.1 --filter agency-os run test:e2e:ci`
  - Result: 4 passed, exit_code 0 (elapsed ~60s)

## Connected services overview

- **Stripe**: ✅ checkout metadata + webhook ingestion in place
- **Clerk**: ✅ org provisioning path exists; webhook syncs tenants to Postgres
- **Postgres 18 (RLS tenant registry)**: ✅ tenants written via Clerk webhook
- **Cloudflare**: ✅ DNS management + SaaS custom hostnames provisioned via admin UI/API

