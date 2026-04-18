/**
 * Prospect email utilities — pure Drizzle, no Firestore.
 */
import { getDb, setTenantContext, leads } from "@dba/database";
import { eq, and } from "drizzle-orm";

/**
 * Get prospect's email preferences.
 */
export async function getProspectEmailPrefs(
  tenantId: string,
  prospectId: string,
): Promise<{ email: string; unsubscribed: boolean; name: string } | null> {
  const db = getDb();
  if (!db) return null;

  await setTenantContext(db, tenantId);
  const rows = await db
    .select({
      email: leads.email,
      unsubscribed: leads.unsubscribed,
      name: leads.name,
    })
    .from(leads)
    .where(
      and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId)),
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Mark a prospect as unsubscribed.
 */
export async function unsubscribeProspect(
  prospectId: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db
      .update(leads)
      .set({ unsubscribed: true, updatedAt: new Date().toISOString() })
      .where(eq(leads.prospectId, prospectId));
    return true;
  } catch {
    return false;
  }
}
