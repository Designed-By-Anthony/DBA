#!/usr/bin/env node
/**
 * Verifies `tenant_domains` exists (run against Neon/staging/prod after migration).
 * Usage: DATABASE_URL=... node scripts/verify-tenant-domains-table.mjs
 * Exit 0 if table exists; 1 if missing or error; 2 if no DATABASE_URL.
 */
import pg from "pg";

const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!url?.trim()) {
  console.warn("SKIP: No DATABASE_URL — set in env to verify tenant_domains exists on Neon.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_domains'`,
  );
  if (r.rowCount === 1) {
    console.log("OK: public.tenant_domains exists.");
    process.exit(0);
  }
  console.error("FAIL: public.tenant_domains not found — apply packages/database/drizzle/0002_tenant_email_domains.sql (or sql/2026-04-18-tenant-email-domains.sql).");
  process.exit(1);
} catch (e) {
  console.error("FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
