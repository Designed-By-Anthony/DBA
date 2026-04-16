import { getDb, tenants } from "@dba/database";
import type { TenantRow } from "@dba/database";
import { eq } from "drizzle-orm";

/** Tenant row from Cloud SQL when `DATABASE_URL` is configured; otherwise `null`. */
export async function getTenantByOrgId(orgId: string): Promise<TenantRow | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db.select().from(tenants).where(eq(tenants.id, orgId)).limit(1);
  return rows[0] ?? null;
}
