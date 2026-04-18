/**
 * Lead webhook agency resolver — pure Drizzle + Postgres.
 */
import { getDb, tenants } from "@dba/database";
import { eq } from "drizzle-orm";

/**
 * Resolve the agency (tenant) ID from an optional incoming agencyId.
 * Falls back to LEAD_WEBHOOK_DEFAULT_AGENCY_ID env var.
 */
export async function resolveLeadAgencyId(
  incomingAgencyId?: string | null,
): Promise<string> {
  // If an agency ID was provided, verify it exists
  if (incomingAgencyId) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select({ clerkOrgId: tenants.clerkOrgId })
        .from(tenants)
        .where(eq(tenants.clerkOrgId, incomingAgencyId))
        .limit(1);

      if (rows.length > 0) return incomingAgencyId;
    } else {
      return incomingAgencyId;
    }
  }

  // Fall back to the default agency ID
  const defaultId = process.env.LEAD_WEBHOOK_DEFAULT_AGENCY_ID;
  if (defaultId) return defaultId;

  return "";
}
