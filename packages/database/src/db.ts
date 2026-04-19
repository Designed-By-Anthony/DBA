import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "../schema";

const { Pool } = pg;

export type Database = NodePgDatabase<typeof schema>;

let _db: Database | null = null;
let _pool: pg.Pool | null = null;

/** Postgres + driver codes for dropped / recycled connections (Neon suspend, PgBouncer, admin SIGTERM). */
function isTransientConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  const code = e.code;
  if (
    code === "57P01" ||
    code === "57P02" ||
    code === "57P03" ||
    code === "08006" ||
    code === "08003" ||
    code === "08000"
  ) {
    return true;
  }
  const msg = String(e.message ?? err);
  return /terminating connection|connection terminated|server closed the connection|ECONNRESET|EPIPE|Connection terminated unexpectedly/i.test(
    msg,
  );
}

async function runWithTransientRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (first) {
    if (!isTransientConnectionError(first)) throw first;
    try {
      return await fn();
    } catch (second) {
      if (isTransientConnectionError(second)) {
        throw new Error(
          `${label}: database connection dropped after retry (${(second as Error).message})`,
          { cause: second },
        );
      }
      throw second;
    }
  }
}

/**
 * Resolve the SSL config for the Postgres pool.
 *
 * Priority:
 *   1. Explicit `DATABASE_SSL=true|1` (legacy opt-in).
 *   2. Connection string `sslmode=require` / `sslmode=verify-*` (preferred —
 *      matches the Augusta Success Checklist: "Append ?sslmode=require to your
 *      connection string in Vercel").
 *   3. Production default: SSL on (Vercel ↔ Postgres over the public internet
 *      must be encrypted; see AGENTS.md > Infrastructure Context).
 *
 * `rejectUnauthorized: false` matches hosted Postgres public endpoints where
 * the CA is not always in Node's default trust store. When `sslmode`
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
    return { rejectUnauthorized: true };
  }

  // Production default — public Postgres endpoints require SSL.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return { rejectUnauthorized: true };
  }

  return undefined;
}

/**
 * Returns a Drizzle instance when a Postgres URL is set; otherwise `null`.
 *
 * This package intentionally keeps a `pg`-compatible interactive transaction
 * path because tenant isolation relies on `set_config(..., true)` inside
 * `withTenantContext`. Neon HTTP is excellent for one-shot queries, but
 * interactive session/transaction semantics belong on `pg` or the Neon
 * WebSocket driver.
 */
export function getDb(): Database | null {
  const url = (process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED)?.trim();
  if (!url) return null;

  if (!_db) {
    _pool = new Pool({
      connectionString: url,
      max: 10,
      ssl: resolveSslConfig(url),
    });
    // Required by node-postgres: idle clients killed by the server (Neon scale-down,
    // pooler rotation, 57P01) emit `error` on the pool — unhandled, this crashes Node.
    _pool.on("error", (err) => {
      console.error("[@dba/database] pg Pool error (idle client):", err.message);
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/**
 * Sets the tenant context for the current connection via `set_config`.
 *
 * With Neon's connection pooler (pgBouncer), SET LOCAL only lives within
 * a transaction. This function must be called at the START of every transaction
 * or query sequence to establish the tenant context.
 *
 * Usage:
 *   const db = getDb();
 *   await setTenantContext(db, tenantId);
 *   // Now run queries with tenant isolation
 */
export async function setTenantContext(db: Database, tenantId: string): Promise<void> {
  await db.execute(
    sql`SELECT set_config('app.current_tenant_id', ${tenantId}, false)`
  );
}

/**
 * Executes a callback within a transaction where the tenant context is guaranteed.
 * This is safe for connection pools and prevents cross-tenant data leaks.
 */
export async function withTenantContext<T>(
  db: Database,
  tenantId: string,
  fn: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>
): Promise<T> {
  return runWithTransientRetry("withTenantContext", () =>
    db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
      return fn(tx);
    }),
  );
}

/**
 * Executes a callback within a transaction where RLS is bypassed.
 * Use this EXTREMELY CAREFULLY, primarily for webhooks or system jobs.
 */
export async function withBypassRls<T>(
  db: Database,
  fn: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>
): Promise<T> {
  return runWithTransientRetry("withBypassRls", () =>
    db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      return fn(tx);
    }),
  );
}

/**
 * Returns a Drizzle instance bound to a specific tenant.
 * Equivalent to calling getDb() and then setTenantContext().
 * Note: This returns the same shared Database instance; setTenantContext
 * must be called to set the tenant context before queries run.
 */
export function getDbForTenant(tenantId: string): Database {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. DATABASE_URL or DATABASE_URL_UNPOOLED must be set.");
  }
  return db;
}

/** Test / shutdown hooks */
export async function closeDbPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
