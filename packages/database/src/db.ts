import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../schema";

const { Pool } = pg;

export type Database = NodePgDatabase<typeof schema>;

let _db: Database | null = null;
let _pool: pg.Pool | null = null;

/**
 * Resolve the SSL config for the Cloud SQL pool.
 *
 * Priority:
 *   1. Explicit `DATABASE_SSL=true|1` (legacy opt-in).
 *   2. Connection string `sslmode=require` / `sslmode=verify-*` (preferred —
 *      matches the Augusta Success Checklist: "Append ?sslmode=require to your
 *      connection string in Vercel").
 *   3. Production default: SSL on (Vercel ↔ Cloud SQL over the public internet
 *      must be encrypted; see AGENTS.md > Infrastructure Context).
 *
 * `rejectUnauthorized: false` matches Cloud SQL's default public
 * endpoint (certificate not in Node's default CA store). When `sslmode`
 * is `verify-full` or `verify-ca`, callers MUST also set `PGSSLROOTCERT`
 * so `pg` picks up the CA.
 */
function resolveSslConfig(url: string): pg.PoolConfig["ssl"] {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  const explicitOn = raw === "true" || raw === "1";
  const explicitOff = raw === "false" || raw === "0";

  let sslmode: string | undefined;
  try {
    const parsed = new URL(url);
    sslmode = parsed.searchParams.get("sslmode")?.toLowerCase() ?? undefined;
  } catch {
    sslmode = undefined;
  }

  if (explicitOff && !sslmode) return undefined;
  if (sslmode === "disable") return undefined;

  if (sslmode === "verify-full" || sslmode === "verify-ca") {
    return { rejectUnauthorized: true };
  }

  if (explicitOn || sslmode === "require" || sslmode === "prefer" || sslmode === "allow") {
    return { rejectUnauthorized: false };
  }

  // Production default — Cloud SQL public IP requires SSL.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

/**
 * Returns a Drizzle instance when `DATABASE_URL` is set; otherwise `null`.
 */
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  if (!_db) {
    _pool = new Pool({
      connectionString: url,
      max: 10,
      ssl: resolveSslConfig(url),
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/** Test / shutdown hooks */
export async function closeDbPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
