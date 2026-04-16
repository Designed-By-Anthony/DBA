# Migration Status Report

## Build verification

- `pnpm turbo build` completed successfully across the monorepo.
- Notable warning surfaced from marketing build logs: Astro reported repeated `MissingSharp` messages during image optimization, but the build still completed with successful task status.

## Phase completion snapshot

### Phase 1: Artifact clean up

- Removed legacy Firebase config artifacts from active app surfaces:
  - `apps/web-viewer/.firebaserc` (deleted)
  - `apps/lighthouse/.firebaserc` (deleted)
  - `apps/marketing/.firebaserc` (deleted)
  - `apps/web-viewer/src/lib/firebase-client.ts` (deleted)
  - `apps/web-viewer/src/proxy.ts` (deleted)
  - sentry test routes/pages in web-viewer (deleted)
- Removed Firebase Admin/Firebase package dependencies from package manifests in this migration branch where requested.
- Updated `apps/web-viewer/next.config.ts` CSP `connect-src` to remove Firestore/Firebase endpoints.

### Phase 2: Security and tenant hardening

- `GET /api/admin/tickets` now enforces tenant scoping via authenticated Clerk org ID.
- Admin ticket update route scopes by `ticket.id + tenantId`.
- Magic-link lookup is now tenant scoped in SQL (`tenantId + emailNormalized`) and receives `orgId` from the portal login client.
- Clerk org lookup paths updated to use `clerk_org_id` as tenant key in SQL-backed lookups.
- Lighthouse `AuditForm` now sends `turnstileToken` in the API request body.
- Added root host-based rewrite middleware at `apps/web-viewer/src/middleware.ts`:
  - admin/app domains rewrite to `/admin...`
  - portal domains rewrite to `/portal...`
  - preview subdomains rewrite to `/preview/[subdomain]...`

### Phase 3: Augusta data bridge

- `packages/database/schema.ts` includes tenant-scoped SQL tables for:
  - `leads`
  - `automations`
  - `tickets`
  - plus portal token/session support tables used by migrated auth flows
- Added `apps/web-viewer/src/lib/vertical-config.ts` and integrated it so vertical UI config is derived from SQL tenant `vertical_type`.

## Firebase string audit

- Zero `firebase` string matches in:
  - `apps/lighthouse/src`
  - `packages/database`
- Remaining `firebase` mentions still exist in `apps/web-viewer/src` due to intentional transitional compatibility imports (`@/lib/firebase`) and legacy Firestore-shaped modules not yet fully migrated to SQL.

## Subdomain routing confirmation

- Middleware rewrite rules are present and active for:
  - `admin.*` / `app.*` style hostnames -> internal `/admin` routes
  - `portal.*` hostnames -> internal `/portal` routes
  - preview hostnames -> internal `/preview/[customer]` routes
