import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../schema";

const { Pool } = pg;

export type Database = NodePgDatabase<typeof schema>;

let _db: Database | null = null;
let _pool: pg.Pool | null = null;

/**
 * Returns a Drizzle instance when `DATABASE_URL` is set; otherwise `null` (Firestore-only mode).
 */
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  if (!_db) {
    _pool = new Pool({
      connectionString: url,
      max: 10,
      ssl:
        process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
          ? { rejectUnauthorized: false }
          : undefined,
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
