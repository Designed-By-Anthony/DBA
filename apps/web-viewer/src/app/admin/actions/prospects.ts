"use server";

import { db } from "@/lib/firebase";
import type { Prospect, ProspectStatus } from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { processAutomations } from "@/lib/automations";
import { evaluateProspectHealth, recalculateLeadScore } from "@/lib/intelligence";
import { generateClientId, getIdSource } from "@/lib/client-id";
import { verifyAuth } from "./auth";
import {
  ensureOwnership,
  findDuplicateProspectForEmail,
  toProspect,
} from "../action-helpers";
import { addActivity } from "./timeline";

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

  if (fields.status && existing.status !== fields.status) {
    await processAutomations(session.user.agencyId, id, "prospect_status_changed", {
      oldStatus: existing.status,
      newStatus: fields.status,
    });
  }
  await evaluateProspectHealth(id);

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
  newStatus: ProspectStatus,
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

function pickLaterIso(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
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
        seen.set(d.id, {
          id: d.id,
          name: (x.name as string) || "",
          email: (x.email as string) || "",
        });
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
        seen.set(d.id, {
          id: d.id,
          name: (x.name as string) || "",
          email: (x.email as string) || "",
        });
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

  const normKeep =
    (keep.emailNormalized || String(keep.email || "").trim().toLowerCase()) || "";
  const normMerge =
    (merge.emailNormalized || String(merge.email || "").trim().toLowerCase()) || "";
  if (!normKeep || !normMerge || normKeep !== normMerge) {
    return { success: false, error: "email_mismatch" };
  }

  const agencyId = session.user.agencyId;
  const mergeName = String(merge.name || "");

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

  const mergedTags = Array.from(
    new Set([
      ...(Array.isArray(keep.tags) ? keep.tags : []),
      ...(Array.isArray(merge.tags) ? merge.tags : []),
    ]),
  );
  const mergedNotes = [keep.notes, merge.notes]
    .filter(Boolean)
    .join("\n\n--- Merged from duplicate record ---\n\n");
  const mergedProjectNotes = [keep.projectNotes, merge.projectNotes]
    .filter(Boolean)
    .join("\n\n---\n\n");
  const mergedStatus =
    stageRank(String(keep.status || "lead")) >= stageRank(String(merge.status || "lead"))
      ? String(keep.status || "lead")
      : String(merge.status || "lead");

  const mergedOnboarding =
    keep.onboarding || merge.onboarding
      ? {
          ...(merge.onboarding as Record<string, unknown>),
          ...(keep.onboarding as Record<string, unknown>),
        }
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

  await addActivity(
    keepId,
    "note_added",
    "Duplicate records merged",
    `Merged prospect ${mergeId}${mergeName ? ` (${mergeName})` : ""} into this record. Combined history, emails, tickets, and tasks.`,
    { mergedProspectId: mergeId, isMerge: true },
  );

  await recalculateLeadScore(keepId);
  await evaluateProspectHealth(keepId);

  return { success: true };
}

// Backward compatibility with older imports
export const getProspectById = getProspect;

