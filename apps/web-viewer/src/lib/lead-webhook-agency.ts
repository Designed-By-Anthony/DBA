import { db } from "@/lib/firebase";

/**
 * Resolves which Firestore tenant (must match Clerk `organization.id` for CRM visibility)
 * for inbound lead webhooks.
 *
 * Priority:
 * 1. `bodyAgencyId` from the form payload (multi-tenant / explicit routing)
 * 2. `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` (Vercel env — set to your Clerk org id, e.g. org_...)
 * 3. First document in `agencies` (legacy / single-tenant)
 * 4. Local dev fallback: `dev-agency` (matches verifyAuth dev session)
 */
export async function resolveLeadAgencyId(bodyAgencyId?: string): Promise<string> {
  const trimmed = bodyAgencyId?.trim();
  if (trimmed) return trimmed;

  const fromEnv = process.env.LEAD_WEBHOOK_DEFAULT_AGENCY_ID?.trim();
  if (fromEnv) return fromEnv;

  try {
    const agencySnap = await db.collection("agencies").limit(1).get();
    if (!agencySnap.empty) {
      return agencySnap.docs[0].id;
    }
  } catch {
    /* collection missing or rules */
  }

  if (process.env.NODE_ENV === "development") {
    return "dev-agency";
  }

  return "";
}
