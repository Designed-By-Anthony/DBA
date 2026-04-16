/**
 * Seed the platform master tenant (Designed By Anthony).
 * Usage (from repo root): `pnpm run db:seed:master`
 * Loads env the same way as `drizzle.config.cjs` (repo `.env`, `apps/web-viewer/.env`, `.env.local`).
 * Override: `DATABASE_URL="postgresql://..." node scripts/seed-master-tenant.mjs`
 *
 * Schema: `tenants` — uuid PK, `clerk_org_id`, `slug`, `vertical`, `config` JSONB.
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

/** Align with `src/db.ts` + Cloud SQL: TLS for non-local hosts or DATABASE_SSL=true. */
function poolSslForUrl(connectionUrl) {
  if (
    process.env.DATABASE_SSL === "false" ||
    process.env.DATABASE_SSL === "0"
  ) {
    return undefined;
  }
  if (
    process.env.DATABASE_SSL === "true" ||
    process.env.DATABASE_SSL === "1"
  ) {
    return { rejectUnauthorized: false };
  }
  try {
    const host = new URL(
      connectionUrl.replace(/^postgres(ql)?:/i, "http:"),
    ).hostname.toLowerCase();
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLocal) return undefined;
  } catch {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: poolSslForUrl(url),
});

const engineConfigJson = JSON.stringify({
  primaryColor: "#2563eb",
  showKitchenDisplay: false,
  customEstimator: false,
});

/** @type {import('pg').PoolClient | undefined} */
let client;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  await client.query("SELECT set_config('app.clerk_org_id', $1, true)", [
    "agency_master",
  ]);
  await client.query(
    `INSERT INTO tenants (clerk_org_id, name, slug, vertical, config)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (clerk_org_id) DO UPDATE SET
       name = EXCLUDED.name,
       slug = EXCLUDED.slug,
       vertical = EXCLUDED.vertical,
       config = EXCLUDED.config`,
    [
      "agency_master",
      "Designed By Anthony",
      "designed-by-anthony",
      "agency",
      engineConfigJson,
    ],
  );
  await client.query("COMMIT");
  console.log("Master tenant upserted (clerk_org_id=agency_master).");
} catch (e) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  console.error(e);
  process.exit(1);
} finally {
  if (client) client.release();
  await pool.end();
}
