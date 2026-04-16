import { db } from "@/lib/firebase";
import type { Prospect } from "@/lib/types";

export async function ensureOwnership(
  collection: string,
  id: string,
  agencyId: string,
) {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) throw new Error(`${collection} not found`);
  const data = doc.data()!;
  if (data.agencyId !== agencyId) {
    throw new Error(
      `Unauthorized: Tenant isolation violation on ${collection}`,
    );
  }
  return data;
}

export function toProspect(
  docId: string,
  data: FirebaseFirestore.DocumentData,
): Prospect {
  return {
    id: docId,
    agencyId: data.agencyId || "",
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    company: data.company || "",
    website: data.website || "",
    targetUrl: data.targetUrl || "",
    status: data.status || "lead",
    dealValue: data.dealValue || 0,
    source: data.source || "",
    tags: data.tags || [],
    notes: data.notes || "",
    assignedTo: data.assignedTo || "",
    createdAt: data.createdAt || new Date().toISOString(),
    lastContactedAt: data.lastContactedAt || null,
    unsubscribed: data.unsubscribed || false,
    calendlyEventUrl: data.calendlyEventUrl || null,
    auditReportUrl: data.auditReportUrl || null,
    contractDocUrl: data.contractDocUrl || null,
    driveFolderUrl: data.driveFolderUrl || null,
    stripeCustomerId: data.stripeCustomerId || null,
    pricingTier: data.pricingTier || null,
    customPricing: data.customPricing || null,
    onboarding: data.onboarding || undefined,
    portalUserId: data.portalUserId || null,
    projectNotes: data.projectNotes || null,
    contractSigned: data.contractSigned || false,
    contractStatus: data.contractStatus || undefined,
    fcmToken: data.fcmToken || null,
    leadScore: data.leadScore ?? undefined,
    healthStatus: data.healthStatus || undefined,
    emailNormalized: data.emailNormalized || undefined,
  };
}

export const STALE_LEAD_DAYS = 14;

export async function findDuplicateProspectForEmail(
  agencyId: string,
  rawEmail: string,
  excludeId?: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const trimmed = rawEmail.trim();
  const norm = trimmed.toLowerCase();
  if (!norm) return null;

  const q1 = await db
    .collection("prospects")
    .where("agencyId", "==", agencyId)
    .where("emailNormalized", "==", norm)
    .limit(2)
    .get();
  const hit1 = q1.docs.find((d) => d.id !== excludeId);
  if (hit1) return hit1;

  const q2 = await db
    .collection("prospects")
    .where("agencyId", "==", agencyId)
    .where("email", "==", trimmed)
    .limit(2)
    .get();
  const hit2 = q2.docs.find((d) => d.id !== excludeId);
  return hit2 ?? null;
}
