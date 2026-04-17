"use server";

import { db } from "@/lib/firebase";
import { auth, currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { sendMail } from "@/lib/mailer";
import {
  wrapLinksForTracking,
  appendComplianceFooter,
  injectTrackingPixel,
  mergeTemplateVars,
} from "@/lib/email-utils";
import { complianceConfig } from "@/lib/theme.config";
import type {
  Prospect,
  EmailRecord,
  DashboardStats,
  ProspectStatus,
  Activity,
  ActivityType,
  QuotePackage,
  CrmTask,
} from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { recalculateLeadScore, evaluateProspectHealth } from "@/lib/intelligence";
import { processAutomations } from "@/lib/automations";
import { generateClientId, getIdSource } from "@/lib/client-id";

// Base URL for tracking endpoints — uses NEXTAUTH_URL in dev, or infer from headers
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================
// Auth Helpers (Clerk)
// ============================================
type DevSession = {
  user: { id: string; email: string; agencyId: string; role: "owner" | "admin" | "member" };
};

export async function verifyAuth(): Promise<DevSession> {
  const { userId, orgId, orgRole } = await auth();
  
  if (!userId || !orgId) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return { user: { id: "dev", email: "dev@local", agencyId: "dev-agency", role: "owner" } };
    }
    throw new Error("Unauthorized: No active session or organization");
  }
  
  // Map Clerk orgRole to our internal role format
  let role: "owner" | "admin" | "member" = "member";
  if (orgRole === "org:admin") role = "owner";
  else if (orgRole === "org:member") role = "member";
  
  // Get email from Clerk only when needed (lazy)
  let email = "";
  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress || "";
  } catch {
    // Non-critical — email is only needed for specific actions
  }
  
  // Set Sentry user context — every error tagged with who triggered it
  Sentry.setUser({ id: userId, email, segment: orgId });
  Sentry.setTag("orgId", orgId);
  Sentry.setTag("orgRole", role);

  return {
    user: { id: userId, email, agencyId: orgId, role }
  };
}

// Security Helper to verify Ownership of a resource
async function ensureOwnership(collection: string, id: string, agencyId: string) {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) throw new Error(`${collection} not found`);
  const data = doc.data()!;
  if (data.agencyId !== agencyId) throw new Error(`Unauthorized: Tenant isolation violation on ${collection}`);
  return data;
}

// ============================================
// Prospect CRUD
// ============================================

// ============================================
// Shared Prospect Mapper
// ============================================
function toProspect(docId: string, data: FirebaseFirestore.DocumentData): Prospect {
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
    // Extended fields
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

const STALE_LEAD_DAYS = 14;

async function findDuplicateProspectForEmail(
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

export async function getProspects(): Promise<Prospect[]> {
  const session = await verifyAuth();
  try {
    const snapshot = await db
      .collection("prospects")
      .where("agencyId", "==", session.user.agencyId)
      .orderBy("createdAt", "desc")
      .get();
    
    if (!snapshot || snapshot.empty) return [];
    
    return snapshot.docs.map((doc) => toProspect(doc.id, doc.data()));
  } catch (err) {
    console.error("Prospect fetch error:", err);
    return [];
  }
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const session = await verifyAuth();
  try {
    const doc = await db.collection("prospects").doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    // Tenant Check
    if (data.agencyId !== session.user.agencyId) return null;
    return toProspect(doc.id, data);
  } catch {
    return null;
  }
}

export async function addProspect(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  targetUrl?: string;
  dealValue?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  status?: ProspectStatus;
}): Promise<
  | { success: true; id: string }
  | { success: false; error: "duplicate_email"; duplicateOfId: string }
> {
  const session = await verifyAuth();

  const dup = await findDuplicateProspectForEmail(session.user.agencyId, data.email);
  if (dup) {
    return { success: false, error: "duplicate_email", duplicateOfId: dup.id };
  }

  // Unified Client ID: 4-char prefix + 4-digit sequence (e.g. desi0001)
  const idSource = getIdSource(data.company, data.name);
  const id = await generateClientId(idSource);

  const emailNorm = data.email.trim().toLowerCase();

  await db.collection("prospects").doc(id).set({
    agencyId: session.user.agencyId,
    name: data.name,
    email: data.email,
    emailNormalized: emailNorm,
    phone: data.phone || "",
    company: data.company || "",
    website: data.website || "",
    targetUrl: data.targetUrl || "",
    dealValue: data.dealValue || 0,
    source: data.source || "",
    tags: data.tags || [],
    notes: data.notes || "",
    assignedTo: "",
    status: data.status || "lead",
    createdAt: new Date().toISOString(),
    lastContactedAt: null,
    unsubscribed: false,
  });

  return { success: true, id };
}

/** Client-side duplicate hint while typing (same checks as addProspect). */
export async function findDuplicateProspectByEmail(
  email: string,
): Promise<{ id: string; name: string } | null> {
  const session = await verifyAuth();
  const dup = await findDuplicateProspectForEmail(session.user.agencyId, email);
  if (!dup) return null;
  const d = dup.data();
  return { id: dup.id, name: (d.name as string) || "" };
}

export async function updateProspect(
  id: string,
  fields: Partial<Omit<Prospect, "id" | "createdAt" | "agencyId">>,
): Promise<{ success: boolean; error?: "duplicate_email" }> {
  const session = await verifyAuth();
  const existing = await ensureOwnership("prospects", id, session.user.agencyId);

  const payload: Record<string, unknown> = { ...fields };
  if (fields.email !== undefined) {
    payload.emailNormalized = String(fields.email).trim().toLowerCase();
    const dup = await findDuplicateProspectForEmail(
      session.user.agencyId,
      String(fields.email),
      id,
    );
    if (dup) {
      return { success: false, error: "duplicate_email" };
    }
  }

  await db.collection("prospects").doc(id).update(payload as FirebaseFirestore.DocumentData);

  // Intelligent Hooks
  if (fields.status && existing.status !== fields.status) {
    await processAutomations(session.user.agencyId, id, 'prospect_status_changed', { oldStatus: existing.status, newStatus: fields.status });
  }
  await evaluateProspectHealth(id); // Recalculate health on any generic update

  return { success: true };
}

export async function deleteProspect(id: string): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", id, session.user.agencyId);
  await db.collection("prospects").doc(id).delete();
  return { success: true };
}

export async function bulkDeleteProspects(ids: string[]): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  const batch = db.batch();
  for (const id of ids) {
    await ensureOwnership("prospects", id, session.user.agencyId);
    batch.delete(db.collection("prospects").doc(id));
  }
  await batch.commit();
  return { success: true };
}

export async function bulkUpdateStatus(
  ids: string[],
  newStatus: ProspectStatus
): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  const batch = db.batch();
  for (const id of ids) {
    await ensureOwnership("prospects", id, session.user.agencyId);
    batch.update(db.collection("prospects").doc(id), { status: newStatus });
  }
  await batch.commit();
  return { success: true };
}

function stageRank(status: string): number {
  const i = pipelineStages.findIndex((s) => s.id === status);
  return i >= 0 ? i : 0;
}

function pickEarlierIso(a: string | undefined, b: string | undefined): string {
  if (!a) return b || new Date().toISOString();
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function pickLaterIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

async function reassignProspectIdOnDocs(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  toId: string,
) {
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const slice = docs.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const d of slice) {
      batch.update(d.ref, { prospectId: toId });
    }
    await batch.commit();
  }
}

/** Other prospects in this agency with the same email (by normalized or raw match). Excludes `prospectId`. */
export async function listOtherProspectsWithSameEmail(
  prospectId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const session = await verifyAuth();
  const self = await getProspect(prospectId);
  if (!self) return [];

  const norm = (self.emailNormalized || self.email.trim().toLowerCase()) || "";
  const raw = self.email.trim();
  const seen = new Map<string, { id: string; name: string; email: string }>();

  if (norm) {
    const q1 = await db
      .collection("prospects")
      .where("agencyId", "==", session.user.agencyId)
      .where("emailNormalized", "==", norm)
      .get();
    q1.docs.forEach((d) => {
      if (d.id !== prospectId) {
        const x = d.data();
        seen.set(d.id, { id: d.id, name: (x.name as string) || "", email: (x.email as string) || "" });
      }
    });
  }

  if (raw) {
    const q2 = await db
      .collection("prospects")
      .where("agencyId", "==", session.user.agencyId)
      .where("email", "==", raw)
      .get();
    q2.docs.forEach((d) => {
      if (d.id !== prospectId) {
        const x = d.data();
        seen.set(d.id, { id: d.id, name: (x.name as string) || "", email: (x.email as string) || "" });
      }
    });
  }

  return [...seen.values()];
}

/**
 * Merges `mergeId` into `keepId` (keep wins for identity), re-points activities/emails/tickets/etc., deletes duplicate.
 * Requires both prospects share the same normalized email (safety).
 */
export async function mergeProspectsIntoKeep(
  keepId: string,
  mergeId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAuth();
  if (keepId === mergeId) return { success: false, error: "same_id" };

  const keepRef = db.collection("prospects").doc(keepId);
  const mergeRef = db.collection("prospects").doc(mergeId);
  const [keepSnap, mergeSnap] = await Promise.all([keepRef.get(), mergeRef.get()]);
  if (!keepSnap.exists || !mergeSnap.exists) return { success: false, error: "not_found" };

  const keep = keepSnap.data()!;
  const merge = mergeSnap.data()!;
  if (keep.agencyId !== session.user.agencyId || merge.agencyId !== session.user.agencyId) {
    return { success: false, error: "forbidden" };
  }

  const normKeep = (keep.emailNormalized || String(keep.email || "").trim().toLowerCase()) || "";
  const normMerge = (merge.emailNormalized || String(merge.email || "").trim().toLowerCase()) || "";
  if (!normKeep || !normMerge || normKeep !== normMerge) {
    return { success: false, error: "email_mismatch" };
  }

  const agencyId = session.user.agencyId;
  const mergeName = String(merge.name || "");

  // --- Subcollections: copy crm_tasks + quotes to keeper, then remove from merge ---
  const mergeTasks = await mergeRef.collection("crm_tasks").get();
  for (const doc of mergeTasks.docs) {
    const data = doc.data();
    await keepRef.collection("crm_tasks").doc(doc.id).set(data);
    await doc.ref.delete();
  }

  const mergeQuotes = await mergeRef.collection("quotes").get();
  for (const doc of mergeQuotes.docs) {
    const data = { ...doc.data(), prospectId: keepId };
    await keepRef.collection("quotes").doc(doc.id).set(data);
    await doc.ref.delete();
  }

  // --- Top-level collections: re-point prospectId ---
  const [actSnap, emailSnap, invSnap, ticketSnap] = await Promise.all([
    db.collection("activities").where("prospectId", "==", mergeId).get(),
    db.collection("emails").where("prospectId", "==", mergeId).get(),
    db.collection("invoices").where("prospectId", "==", mergeId).get(),
    db.collection("tickets").where("prospectId", "==", mergeId).get(),
  ]);

  await reassignProspectIdOnDocs(actSnap.docs, keepId);
  await reassignProspectIdOnDocs(emailSnap.docs, keepId);
  await reassignProspectIdOnDocs(invSnap.docs, keepId);
  await reassignProspectIdOnDocs(ticketSnap.docs, keepId);

  // --- Sequence enrollments: move or drop duplicate active sequence ---
  const enrollSnap = await db
    .collection("sequence_enrollments")
    .where("agencyId", "==", agencyId)
    .where("prospectId", "==", mergeId)
    .get();

  const keepEnrollSnap = await db
    .collection("sequence_enrollments")
    .where("agencyId", "==", agencyId)
    .where("prospectId", "==", keepId)
    .get();
  const activeSeqOnKeep = new Set(
    keepEnrollSnap.docs
      .filter((d) => d.data().status === "active")
      .map((d) => d.data().sequenceId as string),
  );

  for (const doc of enrollSnap.docs) {
    const seqId = doc.data().sequenceId as string;
    const status = doc.data().status as string;
    if (status === "active" && activeSeqOnKeep.has(seqId)) {
      await doc.ref.delete();
    } else {
      await doc.ref.update({
        prospectId: keepId,
        updatedAt: new Date().toISOString(),
      });
      if (status === "active") activeSeqOnKeep.add(seqId);
    }
  }

  // --- Merge scalar fields onto keeper ---
  const mergedTags = Array.from(
    new Set([...(Array.isArray(keep.tags) ? keep.tags : []), ...(Array.isArray(merge.tags) ? merge.tags : [])]),
  );
  const mergedNotes = [keep.notes, merge.notes].filter(Boolean).join("\n\n--- Merged from duplicate record ---\n\n");
  const mergedProjectNotes = [keep.projectNotes, merge.projectNotes].filter(Boolean).join("\n\n---\n\n");
  const mergedStatus =
    stageRank(String(keep.status || "lead")) >= stageRank(String(merge.status || "lead"))
      ? String(keep.status || "lead")
      : String(merge.status || "lead");

  const mergedOnboarding =
    keep.onboarding || merge.onboarding
      ? { ...(merge.onboarding as Record<string, unknown>), ...(keep.onboarding as Record<string, unknown>) }
      : undefined;

  const keepUpdate: Record<string, unknown> = {
    name: (keep.name || merge.name || "").trim(),
    phone: keep.phone || merge.phone || "",
    company: keep.company || merge.company || "",
    website: keep.website || merge.website || "",
    targetUrl: keep.targetUrl || merge.targetUrl || "",
    status: mergedStatus as ProspectStatus,
    dealValue: Math.max(Number(keep.dealValue) || 0, Number(merge.dealValue) || 0),
    source: keep.source || merge.source || "",
    tags: mergedTags,
    notes: mergedNotes,
    assignedTo: keep.assignedTo || merge.assignedTo || "",
    createdAt: pickEarlierIso(keep.createdAt as string, merge.createdAt as string),
    lastContactedAt: pickLaterIso(
      keep.lastContactedAt as string | null,
      merge.lastContactedAt as string | null,
    ),
    unsubscribed: !!(keep.unsubscribed || merge.unsubscribed),
    calendlyEventUrl: keep.calendlyEventUrl || merge.calendlyEventUrl || null,
    auditReportUrl: keep.auditReportUrl || merge.auditReportUrl || null,
    contractDocUrl: keep.contractDocUrl || merge.contractDocUrl || null,
    driveFolderUrl: keep.driveFolderUrl || merge.driveFolderUrl || null,
    stripeCustomerId: keep.stripeCustomerId || merge.stripeCustomerId || null,
    portalUserId: keep.portalUserId || merge.portalUserId || null,
    pricingTier: keep.pricingTier ?? merge.pricingTier ?? null,
    customPricing: keep.customPricing ?? merge.customPricing ?? null,
    projectNotes: mergedProjectNotes || null,
    contractSigned: !!(keep.contractSigned || merge.contractSigned),
    contractStatus: keep.contractStatus || merge.contractStatus || undefined,
    fcmToken: keep.fcmToken || merge.fcmToken || null,
    stagingUrl: keep.stagingUrl || merge.stagingUrl || null,
    emailNormalized: normKeep,
  };
  if (mergedOnboarding && Object.keys(mergedOnboarding).length > 0) {
    keepUpdate.onboarding = mergedOnboarding;
  }

  await keepRef.update(keepUpdate as FirebaseFirestore.DocumentData);

  await mergeRef.delete();

  await db.collection("activities").add({
    agencyId,
    prospectId: keepId,
    type: "note_added",
    title: "Duplicate records merged",
    description: `Merged prospect ${mergeId}${mergeName ? ` (${mergeName})` : ""} into this record. Combined history, emails, tickets, and tasks.`,
    metadata: { mergedProspectId: mergeId, isMerge: true },
    createdAt: new Date().toISOString(),
  });

  await recalculateLeadScore(keepId);
  await evaluateProspectHealth(keepId);

  return { success: true };
}

export async function saveQuoteAction(
  prospectId: string,
  quotePayload: Record<string, unknown>,
): Promise<{ success: boolean; quoteId: string }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);
  
  const quoteRef = db.collection("prospects").doc(prospectId).collection("quotes").doc();
  const quoteData = {
    ...quotePayload,
    id: quoteRef.id,
    agencyId: session.user.agencyId,
    prospectId,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  
  await quoteRef.set(quoteData);
  
  // Also log the activity
  const { addActivity } = await import("./actions"); // recursive reference ok or just use directly
  try {
    const packages = quotePayload["packages"] as QuotePackage[] | undefined;
    const totalCents = packages?.[0]?.totalOneTimeCents ?? 0;
    await addActivity(prospectId, "note_added", "Quote Draft Created", `A new quote ($${(totalCents / 100).toFixed(2)}) has been drafted for the portal.`, { quoteId: quoteRef.id });
  } catch {
    /* activity logging is best-effort */
  }

  return { success: true, quoteId: quoteRef.id };
}

// ============================================
// Email Sending
// ============================================

export async function sendEmail(params: {
  prospectIds: string[];
  subject: string;
  bodyHtml: string;
  fromName?: string;
  fromEmail?: string;
  scheduledAt?: string | null;
}): Promise<{ success: boolean; sent: number; errors: string[] }> {
  const session = await verifyAuth();

  const errors: string[] = [];
  let sent = 0;

  for (const prospectId of params.prospectIds) {
    const prospect = await getProspect(prospectId);
    if (!prospect) {
      errors.push(`Prospect ${prospectId} not found`);
      continue;
    }
    // Tenant Safety Check (getProspect handles this but double checking in loop)
    if (prospect.agencyId !== session.user.agencyId) continue;
    
    if (prospect.unsubscribed) {
      errors.push(`${prospect.name} has unsubscribed — skipped`);
      continue;
    }
    if (!prospect.email) {
      errors.push(`${prospect.name} has no email address — skipped`);
      continue;
    }

    // Create email record in Firestore first
    const emailRef = db.collection("emails").doc();
    const emailId = emailRef.id;

    // Merge template variables
    let processedBody = mergeTemplateVars(params.bodyHtml, {
      name: prospect.name.split(" ")[0], // First name
      company: prospect.company || prospect.name,
      website: prospect.website || "",
      email: prospect.email,
    });

    // Process body: wrap links, add footer, inject pixel
    processedBody = wrapLinksForTracking(processedBody, emailId, BASE_URL);
    processedBody = appendComplianceFooter(
      processedBody,
      prospectId,
      BASE_URL,
      complianceConfig.companyName,
      complianceConfig.physicalAddress
    );
    processedBody = injectTrackingPixel(processedBody, emailId, BASE_URL);

    // Wrap in a styled email container
    const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      ${processedBody}
    </div>
  </div>
</body>
</html>`;

    try {
      const subjectLine = mergeTemplateVars(params.subject, {
        name: prospect.name.split(" ")[0],
        company: prospect.company || prospect.name,
      });

      const result = await sendMail({
        from: `${params.fromName || complianceConfig.fromName} <${params.fromEmail || complianceConfig.fromEmail}>`,
        to: prospect.email,
        replyTo: params.fromEmail || complianceConfig.replyTo,
        subject: subjectLine,
        html: fullHtml,
        ...(params.scheduledAt ? { scheduledAt: params.scheduledAt } : {}),
      });

      if (!result.ok) {
        errors.push(`Failed to send to ${prospect.name}: ${result.error}`);
        continue;
      }

      const emailRecord: Omit<EmailRecord, "clicks"> & { clicks: unknown[] } = {
        id: emailId,
        agencyId: session.user.agencyId,
        prospectId,
        prospectEmail: prospect.email,
        prospectName: prospect.name,
        subject: subjectLine,
        bodyHtml: params.bodyHtml,
        status: params.scheduledAt ? "scheduled" : "sent",
        scheduledAt: params.scheduledAt || null,
        sentAt: params.scheduledAt ? null : new Date().toISOString(),
        resendId: result.mode === "resend" ? result.id : null,
        opens: 0,
        clicks: [],
        createdAt: new Date().toISOString(),
      };

      await emailRef.set(emailRecord);

      // Update prospect's last contacted date
      await db.collection("prospects").doc(prospectId).update({
        lastContactedAt: new Date().toISOString(),
        ...(prospect.status === "lead" ? { status: "contacted" } : {}),
      });

      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to send to ${prospect.name}: ${msg}`);
    }
  }

  return { success: errors.length === 0, sent, errors };
}

export async function sendTestEmail(params: {
  prospectId?: string;
  testEmailAddress: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<{ success: boolean; error?: string }> {
  await verifyAuth();

  let pName = "Jane";
  let pCompany = "Acme Corp";
  let pWebsite = "https://acme.com";

  if (params.prospectId) {
    const prospect = await getProspect(params.prospectId);
    if (prospect) {
      pName = prospect.name.split(" ")[0];
      pCompany = prospect.company || prospect.name;
      pWebsite = prospect.website || "";
    }
  }

  const processedBody = mergeTemplateVars(params.bodyHtml, {
    name: pName,
    company: pCompany,
    website: pWebsite,
    email: params.testEmailAddress,
  });

  const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="margin-bottom:20px;padding:10px;background:#fff3cd;color:#856404;border-left:4px solid #ffeeba;font-size:12px;">
        <strong>TEST EMAIL PREVIEW</strong><br/>Links and tracking pixels are disabled in test mode.
      </div>
      ${processedBody}
    </div>
  </div>
</body>
</html>`;

  const result = await sendMail({
    from: `${params.fromName || complianceConfig.fromName} <${params.fromEmail || complianceConfig.fromEmail}>`,
    to: params.testEmailAddress,
    replyTo: params.fromEmail || complianceConfig.replyTo,
    subject: `[TEST] ` + mergeTemplateVars(params.subject, { name: pName, company: pCompany }),
    html: fullHtml,
  });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true };
}

// ============================================
// Email History
// ============================================

export async function getEmailHistory(prospectId?: string): Promise<EmailRecord[]> {
  const session = await verifyAuth();
  try {
    let query: FirebaseFirestore.Query = db
        .collection("emails")
        .where("agencyId", "==", session.user.agencyId)
        .orderBy("createdAt", "desc");
        
    if (prospectId) {
      query = query.where("prospectId", "==", prospectId);
    }
    const snapshot = await query.limit(100).get();
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as EmailRecord));
  } catch {
    return [];
  }
}

// ============================================
// Dashboard Stats
// ============================================

const probByStatus: Record<ProspectStatus, number> = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.probability]),
) as Record<ProspectStatus, number>;

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await verifyAuth();

  let prospectsSnap: FirebaseFirestore.QuerySnapshot;
  let emailsSnap: FirebaseFirestore.QuerySnapshot;
  try {
    [prospectsSnap, emailsSnap] = await Promise.all([
      db.collection("prospects").where("agencyId", "==", session.user.agencyId).get(),
      db.collection("emails").where("agencyId", "==", session.user.agencyId).get(),
    ]);
  } catch {
    return {
      totalProspects: 0,
      prospectsByStatus: { lead: 0, contacted: 0, proposal: 0, dev: 0, launched: 0 },
      emailsSent: 0,
      emailsScheduled: 0,
      totalOpens: 0,
      totalClicks: 0,
      pipelineValue: 0,
      forecastedMrr: 0,
      weightedPipelineValue: 0,
      staleLeadCount: 0,
      overdueOpenTasksCount: 0,
      pipelineVelocityDays: 0,
    };
  }

  const prospects = prospectsSnap.docs.map((d) => d.data());
  const emails = emailsSnap.docs.map((d) => d.data());

  const statusCounts: Record<ProspectStatus, number> = {
    lead: 0, contacted: 0, proposal: 0, dev: 0, launched: 0,
  };

  let pipelineValue = 0;
  let weightedPipelineValue = 0;
  let totalVelocityDays = 0;
  let launchedCount = 0;
  const now = Date.now();
  const staleMs = STALE_LEAD_DAYS * 24 * 60 * 60 * 1000;
  let staleLeadCount = 0;

  prospects.forEach((p) => {
    const s = (p.status || "lead") as ProspectStatus;
    if (statusCounts[s] !== undefined) statusCounts[s]++;

    const deal = Number(p.dealValue) || 0;
    if (s !== "launched") {
      pipelineValue += deal;
      const prob = probByStatus[s] ?? 0.1;
      weightedPipelineValue += deal * prob;
    } else {
      launchedCount++;
      const days = Math.floor(
        (Date.now() - new Date(p.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24),
      );
      totalVelocityDays += Math.max(1, days);
    }

    if (s !== "launched") {
      const lastTouch = p.lastContactedAt
        ? new Date(p.lastContactedAt as string).getTime()
        : new Date((p.createdAt as string) || Date.now()).getTime();
      if (now - lastTouch > staleMs) staleLeadCount++;
    }
  });

  const sentEmails = emails.filter((e) => e.status === "sent" || e.status === "scheduled");
  const totalOpens = emails.reduce((acc, e) => acc + (e.opens || 0), 0);
  const totalClicks = emails.reduce(
    (acc, e) => acc + (Array.isArray(e.clicks) ? e.clicks.length : 0),
    0,
  );

  let overdueOpenTasksCount = 0;
  try {
    const taskSnap = await db
      .collectionGroup("crm_tasks")
      .where("agencyId", "==", session.user.agencyId)
      .where("completed", "==", false)
      .limit(200)
      .get();
    taskSnap.docs.forEach((d) => {
      const due = new Date((d.data().dueAt as string) || 0).getTime();
      if (due < now) overdueOpenTasksCount++;
    });
  } catch {
    /* Missing index or empty — leave at 0 */
  }

  const roundedWeighted = Math.round(weightedPipelineValue);

  return {
    totalProspects: prospects.length,
    prospectsByStatus: statusCounts,
    emailsSent: sentEmails.filter((e) => e.status === "sent").length,
    emailsScheduled: sentEmails.filter((e) => e.status === "scheduled").length,
    totalOpens,
    totalClicks,
    pipelineValue,
    forecastedMrr: roundedWeighted,
    weightedPipelineValue: roundedWeighted,
    staleLeadCount,
    overdueOpenTasksCount,
    pipelineVelocityDays: launchedCount > 0 ? Math.round(totalVelocityDays / launchedCount) : 0,
  };
}

// ============================================
// CRM Tasks (subcollection: prospects/{id}/crm_tasks)
// ============================================

function taskFromDoc(
  prospectId: string,
  docId: string,
  data: FirebaseFirestore.DocumentData,
): CrmTask {
  return {
    id: docId,
    prospectId,
    agencyId: data.agencyId || "",
    title: data.title || "",
    dueAt: data.dueAt || new Date().toISOString(),
    completed: !!data.completed,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export async function getCrmTasksForProspect(prospectId: string): Promise<CrmTask[]> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);
  const snap = await db
    .collection("prospects")
    .doc(prospectId)
    .collection("crm_tasks")
    .orderBy("dueAt", "asc")
    .get();
  return snap.docs.map((d) => taskFromDoc(prospectId, d.id, d.data()));
}

export async function createCrmTask(
  prospectId: string,
  input: { title: string; dueAt: string },
): Promise<{ success: boolean; id?: string }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);
  const title = input.title?.trim();
  if (!title) return { success: false };
  const ref = db.collection("prospects").doc(prospectId).collection("crm_tasks").doc();
  const createdAt = new Date().toISOString();
  await ref.set({
    agencyId: session.user.agencyId,
    title,
    dueAt: input.dueAt || createdAt,
    completed: false,
    createdAt,
  });
  return { success: true, id: ref.id };
}

export async function updateCrmTask(
  prospectId: string,
  taskId: string,
  fields: Partial<Pick<CrmTask, "title" | "dueAt" | "completed">>,
): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);
  const ref = db.collection("prospects").doc(prospectId).collection("crm_tasks").doc(taskId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Task not found");
  if (doc.data()?.agencyId !== session.user.agencyId) {
    throw new Error("Unauthorized");
  }
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title.trim();
  if (fields.dueAt !== undefined) patch.dueAt = fields.dueAt;
  if (fields.completed !== undefined) patch.completed = fields.completed;
  await ref.update(patch);
  return { success: true };
}

export async function deleteCrmTask(prospectId: string, taskId: string): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);
  const ref = db.collection("prospects").doc(prospectId).collection("crm_tasks").doc(taskId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Task not found");
  if (doc.data()?.agencyId !== session.user.agencyId) {
    throw new Error("Unauthorized");
  }
  await ref.delete();
  return { success: true };
}

// getProspectById is now an alias for the consolidated getProspect()
// Kept as a named re-export for backward compatibility with existing imports
export const getProspectById = getProspect;

// ============================================
// Activity Timeline
// ============================================

export async function getActivities(prospectId: string): Promise<Activity[]> {
  const session = await verifyAuth();
  try {
    const snapshot = await db
      .collection("activities")
      .where("agencyId", "==", session.user.agencyId)
      .where("prospectId", "==", prospectId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      agencyId: doc.data().agencyId,
      prospectId: doc.data().prospectId,
      type: doc.data().type as ActivityType,
      title: doc.data().title || "",
      description: doc.data().description || undefined,
      metadata: doc.data().metadata || undefined,
      createdAt: doc.data().createdAt || "",
    }));
  } catch {
    return [];
  }
}

export async function addActivity(
  prospectId: string,
  type: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const session = await verifyAuth();
  await db.collection("activities").add({
    agencyId: session.user.agencyId,
    prospectId,
    type,
    title,
    description: description || null,
    metadata: metadata || null,
    createdAt: new Date().toISOString(),
  });
  
  // Asynchronous Intelligence execution
  await recalculateLeadScore(prospectId);
  await evaluateProspectHealth(prospectId);
  await processAutomations(session.user.agencyId, prospectId, 'activity_added', { type });
}

export async function addNote(prospectId: string, note: string): Promise<void> {
  const session = await verifyAuth();
  if (!note.trim()) return;

  await ensureOwnership("prospects", prospectId, session.user.agencyId);

  // Add to activity timeline
  await addActivity(prospectId, 'note_added', 'Note added', note);

  // Also append to the prospect notes field
  const doc = await db.collection("prospects").doc(prospectId).get();
  if (doc.exists) {
    const existing = doc.data()?.notes || "";
    await db.collection("prospects").doc(prospectId).update({
      notes: existing ? `${existing}\n[${new Date().toLocaleDateString()}] ${note}` : note,
    });
  }
}

// ============================================
// Stripe Payment Actions
// ============================================

export async function createPaymentLinkAction(params: {
  prospectId: string;
  amount: number;
  type: "down_payment" | "completion";
  description: string;
}): Promise<{ url: string | null; error?: string }> {
  /* ... Stripe action logic uses getProspect which is already tenant isolated ... */
  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    if (process.env.NEXT_PUBLIC_IS_TEST === 'true') {
      await addActivity(params.prospectId, "note_added", `Payment link created: $${params.amount.toLocaleString()} (${params.type})`, params.description, { stripeSessionId: 'cs_test_mock_12345' });
      return { url: 'https://checkout.stripe.com/c/pay/cs_test_mock_12345' };
    }

    const { createPaymentLink } = await import("@/lib/stripe");
    const result = await createPaymentLink({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      amount: params.amount,
      type: params.type,
      description: params.description,
    });

    await addActivity(params.prospectId, "note_added", `Payment link created: $${params.amount.toLocaleString()} (${params.type})`, params.description, { stripeSessionId: result.sessionId });
    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create payment link";
    return { url: null, error: msg };
  }
}

export async function createSubscriptionAction(params: {
  prospectId: string;
  stripePriceId: string;
}): Promise<{ url: string | null; error?: string }> {
  await verifyAuth(); // Auth gate — tenant isolation handled by getProspect()

  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    const { createSubscription } = await import("@/lib/stripe");
    const result = await createSubscription({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      stripePriceId: params.stripePriceId,
    });

    if (result.customerId) {
      await db.collection("prospects").doc(params.prospectId).update({
        stripeCustomerId: result.customerId,
      });
    }

    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create subscription";
    return { url: null, error: msg };
  }
}

export async function getInvoices(prospectId?: string): Promise<import("@/lib/types").Invoice[]> {
  const session = await verifyAuth();
  try {
    let query: FirebaseFirestore.Query = db
      .collection("invoices")
      .where("agencyId", "==", session.user.agencyId)
      .orderBy("createdAt", "desc");
      
    if (prospectId) {
      query = query.where("prospectId", "==", prospectId);
    }
    const snapshot = await query.limit(100).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as import("@/lib/types").Invoice[];
  } catch {
    return [];
  }
}

// ============================================
// Google Workspace Actions
// ============================================

export async function generateContractAction(params: {
  prospectId: string;
  downPayment: number;
  completionPayment: number;
  monthlyRetainer: number;
  retainerTierName: string;
  crmTierName: string;
}): Promise<{ docUrl: string | null; error?: string }> {
  await verifyAuth(); // Auth gate — tenant isolation handled by getProspect()

  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { docUrl: null, error: "Prospect not found" };

    if (process.env.NEXT_PUBLIC_IS_TEST === 'true') {
      await db.collection("prospects").doc(params.prospectId).update({
        contractDocUrl: "https://docs.google.com/test-sandbox-doc",
        status: "proposal",
      });
      return { docUrl: "https://docs.google.com/test-sandbox-doc" };
    }

    const { generateContract } = await import("@/lib/google-workspace");
    const result = await generateContract({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
      clientPhone: prospect.phone,
      downPayment: params.downPayment,
      completionPayment: params.completionPayment,
      monthlyRetainer: params.monthlyRetainer,
      retainerTierName: params.retainerTierName,
      crmTierName: params.crmTierName,
    });

    await db.collection("prospects").doc(params.prospectId).update({
      contractDocUrl: result.docUrl,
      status: prospect.status === "lead" || prospect.status === "contacted" ? "proposal" : prospect.status,
    });

    await addActivity(params.prospectId, "contract_sent", "Contract generated and shared", `MSA sent to ${prospect.email} for e-signature`, { docId: result.docId, docUrl: result.docUrl });

    return { docUrl: result.docUrl };
  } catch (err: unknown) {
    console.error('[Contract Generation Error]', err);
    return { docUrl: null, error: err instanceof Error ? err.message : "Failed to generate contract" };
  }
}

export async function createClientFolderAction(
  prospectId: string
): Promise<{ folderUrl: string | null; error?: string }> {
  /* getProspect handles isolation */
  try {
    const prospect = await getProspect(prospectId);
    if (!prospect) return { folderUrl: null, error: "Prospect not found" };

    const { createClientFolder } = await import("@/lib/google-workspace");
    const result = await createClientFolder({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
    });

    await db.collection("prospects").doc(prospectId).update({
      driveFolderUrl: result.folderUrl,
    });

    await addActivity(prospectId, "note_added", "Google Drive folder created", `Client folder with Assets/Contracts/Deliverables subfolders. Assets folder shared with ${prospect.email}`, { folderId: result.folderId, folderUrl: result.folderUrl });

    return { folderUrl: result.folderUrl };
  } catch (err: unknown) {
    return { folderUrl: null, error: err instanceof Error ? err.message : "Failed to create Drive folder" };
  }
}

// ============================================
// Global Omnisearch Engine
// ============================================

export async function searchOmni(query: string): Promise<{
  id: string;
  name: string;
  email: string;
  company: string;
}[]> {
  const session = await verifyAuth();
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  try {
    const snapshot = await db
        .collection("prospects")
        .where("agencyId", "==", session.user.agencyId)
        .get();
        
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        email: doc.data().email || "",
        company: doc.data().company || "",
      }))
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);

    return results;
  } catch (e) {
    console.error("Omnisearch Error:", e);
    return [];
  }
}

// ============================================
// Recent Activities (Notification Feed)
// ============================================
export async function getRecentActivities(limit = 10) {
  const session = await verifyAuth();
  const agencyId = session.user.agencyId;

  const snap = await db
    .collection("activities")
    .where("agencyId", "==", agencyId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      type: d.type || "info",
      description: d.description || "",
      prospectId: d.prospectId || null,
      createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  });
}

