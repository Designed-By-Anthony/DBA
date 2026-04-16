/*
  Row Level Security — public.tenants + public.sites (multi-tenant Cloud SQL).

  Prerequisites: tables exist (Drizzle schema / db:push).

  Application code must use `withTenantClerkOrg` / `withTenantSqlContext` (@dba/database) so every
  transaction runs:
    SELECT set_config('app.clerk_org_id', '<clerk_org_id>', true);
  (`true` = SET LOCAL semantics — cleared at COMMIT; safe for pooled connections.)

  Apply once (idempotent):
    pnpm --filter @dba/database run db:apply-rls
  Verify catalog state:
    pnpm --filter @dba/database run db:verify-rls

  Roles:
  - **Migrate / DDL**: use an owner or superuser to run this file and drizzle-kit. Cloud SQL
    `cloudsqlsuperuser` bypasses RLS — OK for one-off policy installs only.
  - **Runtime (Vercel)**: use a normal role with **NOBYPASSRLS** (default for non-superusers).
    FORCE ROW LEVEL SECURITY ensures even the table owner cannot skip policies by accident.

  Seed: scripts/seed-master-tenant.mjs uses BEGIN + set_config + INSERT in one transaction.
*/

ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sites FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_tenant_isolation ON public.tenants;
CREATE POLICY tenants_tenant_isolation ON public.tenants
  FOR ALL
  USING (clerk_org_id = current_setting('app.clerk_org_id', true))
  WITH CHECK (clerk_org_id = current_setting('app.clerk_org_id', true));

DROP POLICY IF EXISTS sites_tenant_isolation ON public.sites;
CREATE POLICY sites_tenant_isolation ON public.sites
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );
