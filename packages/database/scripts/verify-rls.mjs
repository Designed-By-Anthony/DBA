/**
 * Verify RLS is enabled on public.tenants / public.sites and expected policies exist.
 * Does not read tenant PII — catalog checks only. Uses DATABASE_URL like apply-rls.mjs.
 *
 *   pnpm --filter @dba/database run db:verify-rls
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(repoRoot, "apps/web-viewer/.env") });
config({ path: path.join(repoRoot, "apps/web-viewer/.env.local"), override: true });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

function poolSslForUrl(connectionUrl) {
  if (process.env.DATABASE_SSL === "false" || process.env.DATABASE_SSL === "0") {
    return undefined;
  }
  if (process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1") {
    return { rejectUnauthorized: false };
  }
  try {
    const host = new URL(
      connectionUrl.replace(/^postgres(ql)?:/i, "http:"),
    ).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: poolSslForUrl(url),
});

function assert(cond, msg) {
  if (!cond) {
    console.error(`verify-rls: FAIL — ${msg}`);
    process.exit(1);
  }
}

try {
  const flags = await pool.query(
    `SELECT c.relname AS table,
            c.relrowsecurity AS rls_enabled,
            c.relforcerowsecurity AS rls_forced
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relname IN ('tenants', 'sites')`,
  );

  const byTable = Object.fromEntries(flags.rows.map((r) => [r.table, r]));
  assert(byTable.tenants, 'table "tenants" not found in public schema');
  assert(byTable.sites, 'table "sites" not found in public schema');
  assert(byTable.tenants.rls_enabled === true, 'public.tenants must have RLS enabled');
  assert(byTable.tenants.rls_forced === true, 'public.tenants must use FORCE ROW LEVEL SECURITY');
  assert(byTable.sites.rls_enabled === true, 'public.sites must have RLS enabled');
  assert(byTable.sites.rls_forced === true, 'public.sites must use FORCE ROW LEVEL SECURITY');

  const policies = await pool.query(
    `SELECT tablename, policyname
     FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('tenants', 'sites')`,
  );

  const names = policies.rows.map((r) => `${r.tablename}:${r.policyname}`);
  assert(
    names.includes("tenants:tenants_tenant_isolation"),
    `expected policy tenants:tenants_tenant_isolation, got: ${names.join(", ") || "(none)"}`,
  );
  assert(
    names.includes("sites:sites_tenant_isolation"),
    `expected policy sites:sites_tenant_isolation, got: ${names.join(", ") || "(none)"}`,
  );

  console.log("RLS verify OK — tenants + sites have RLS+FORCE and isolation policies.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await pool.end();
}
