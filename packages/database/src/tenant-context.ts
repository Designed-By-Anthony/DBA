import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../schema";

export type AppDatabase = NodePgDatabase<typeof schema>;

/**
 * Runs `fn` inside a transaction with `SET LOCAL app.clerk_org_id` so Postgres RLS policies
 * on `public.tenants` / `public.sites` (see `sql/enable_rls.sql`) allow only that Clerk org’s rows.
 *
 * Every Drizzle read/write to those tables must go through this wrapper (or an equivalent
 * raw `BEGIN` + `set_config` + one transaction). Do not query `tenants`/`sites` on a pooled
 * `getDb()` handle without tenant context.
 */
export async function withTenantClerkOrg<T>(
  db: AppDatabase,
  clerkOrgId: string,
  fn: (tx: AppDatabase) => Promise<T>,
): Promise<T> {
  const id = clerkOrgId.trim();
  if (!id) {
    throw new Error("withTenantClerkOrg: clerkOrgId is required");
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.clerk_org_id', ${id}, true)`);
    return fn(tx);
  });
}

/** Alias for {@link withTenantClerkOrg} (launch-plan / defense-in-depth naming). */
export const withTenantSqlContext = withTenantClerkOrg;
