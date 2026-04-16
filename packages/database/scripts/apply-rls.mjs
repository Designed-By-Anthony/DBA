/**
 * Apply packages/database/sql/enable_rls.sql to the database in DATABASE_URL.
 * Same env loading as seed-master-tenant.mjs.
 */
import fs from "node:fs";
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

const sqlPath = path.join(__dirname, "../sql/enable_rls.sql");
const sqlText = fs.readFileSync(sqlPath, "utf8");

const pool = new pg.Pool({
  connectionString: url,
  ssl: poolSslForUrl(url),
});

try {
  await pool.query(sqlText);
  console.log("RLS policies applied (see sql/enable_rls.sql).");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await pool.end();
}
