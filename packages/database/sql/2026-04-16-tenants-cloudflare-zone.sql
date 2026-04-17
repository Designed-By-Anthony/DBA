-- Migration: add per-tenant Cloudflare zone columns to public.tenants.
--
-- Idempotent. Safe to run multiple times. Apply with `psql $DATABASE_URL -f
-- packages/database/sql/2026-04-16-tenants-cloudflare-zone.sql`, or let
-- `pnpm db:push` from the @dba/database package pick the change up from
-- schema.ts if you prefer drizzle-kit's diff.
--
-- Both columns are NULLABLE on purpose. Any tenant that hasn't been
-- provisioned for Cloudflare leaves them blank; `resolveTenantZone()` in
-- apps/web-viewer/src/lib/tenant-zone.ts will return a structured
-- tenant_not_provisioned error in that case (which admin routes should
-- surface as 404, never as "fall through to some other zone").

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS cloudflare_zone_id text;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS cloudflare_apex_hostname text;

-- Optional: an index is NOT needed here. Lookups are always by
-- clerk_org_id (the primary key) and we select cloudflareZoneId as a
-- column in the same row read — no secondary scan path exists.
