-- Tenant email domains for Resend onboarding (same as sql/2026-04-18-tenant-email-domains.sql).
-- Apply after 0001 on Neon/staging/prod if not already applied via sql/ path.

CREATE TABLE IF NOT EXISTS "public"."tenant_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "domain_name" text NOT NULL,
  "resend_id" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "records" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_checked_at" text,
  "verified_at" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_tenant_domains_tenant_domain"
  ON "public"."tenant_domains"("tenant_id", "domain_name");

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_tenant_domains_tenant_resend"
  ON "public"."tenant_domains"("tenant_id", "resend_id");

CREATE INDEX IF NOT EXISTS "idx_tenant_domains_tenant_status"
  ON "public"."tenant_domains"("tenant_id", "status");

ALTER TABLE "public"."tenant_domains" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_tenant_domains" ON "public"."tenant_domains";
CREATE POLICY "tenant_isolation_tenant_domains" ON "public"."tenant_domains"
  USING ("tenant_id" = current_setting('app.current_tenant_id', true));
