"use server";

import { db } from "@/lib/firebase";
import { getProspect, verifyAuth } from "@/app/admin/actions";
import { computeInitialNextRunAt, processDueSequenceEnrollments } from "@/lib/email-sequence-processor";
import type { EmailSequenceDefinition, EmailSequenceStep } from "@/lib/types";

export async function listEmailSequences(): Promise<EmailSequenceDefinition[]> {
  const session = await verifyAuth();
  const snap = await db
    .collection("email_sequences")
    .where("agencyId", "==", session.user.agencyId)
    .get();
  const rows = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<EmailSequenceDefinition, "id">),
  }));
  return rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function createEmailSequence(input: {
  name: string;
  steps: EmailSequenceStep[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await verifyAuth();
  const name = input.name?.trim();
  if (!name || !input.steps?.length) {
    return { success: false, error: "Name and at least one step are required" };
  }
  const now = new Date().toISOString();
  const ref = await db.collection("email_sequences").add({
    agencyId: session.user.agencyId,
    name,
    isActive: true,
    steps: input.steps,
    createdAt: now,
    updatedAt: now,
  });
  return { success: true, id: ref.id };
}

export async function updateEmailSequence(
  id: string,
  fields: Partial<Pick<EmailSequenceDefinition, "name" | "isActive" | "steps">>,
): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  const doc = await db.collection("email_sequences").doc(id).get();
  if (!doc.exists || doc.data()?.agencyId !== session.user.agencyId) {
    throw new Error("Not found");
  }
  await db.collection("email_sequences").doc(id).update({
    ...fields,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function deleteEmailSequence(id: string): Promise<{ success: boolean }> {
  const session = await verifyAuth();
  const doc = await db.collection("email_sequences").doc(id).get();
  if (!doc.exists || doc.data()?.agencyId !== session.user.agencyId) {
    throw new Error("Not found");
  }
  await db.collection("email_sequences").doc(id).delete();
  return { success: true };
}

export async function enrollProspectInSequence(
  prospectId: string,
  sequenceId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAuth();
  const p = await getProspect(prospectId);
  if (!p || p.agencyId !== session.user.agencyId) {
    return { success: false, error: "Prospect not found" };
  }
  const seqDoc = await db.collection("email_sequences").doc(sequenceId).get();
  if (!seqDoc.exists || seqDoc.data()?.agencyId !== session.user.agencyId) {
    return { success: false, error: "Sequence not found" };
  }
  const steps = (seqDoc.data()?.steps || []) as EmailSequenceStep[];
  if (!steps.length) return { success: false, error: "Sequence has no steps" };

  const existingSnap = await db
    .collection("sequence_enrollments")
    .where("agencyId", "==", session.user.agencyId)
    .where("prospectId", "==", prospectId)
    .get();
  const already = existingSnap.docs.some(
    (d) => d.data().sequenceId === sequenceId && d.data().status === "active",
  );
  if (already) {
    return { success: false, error: "Already enrolled in this sequence" };
  }

  const nextRunAt = computeInitialNextRunAt(steps);
  await db.collection("sequence_enrollments").add({
    agencyId: session.user.agencyId,
    prospectId,
    sequenceId,
    stepIndex: 0,
    nextRunAt,
    status: "active",
    enrolledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function runDueSequenceEmails(): Promise<{
  processed: number;
  errors: string[];
}> {
  await verifyAuth();
  return processDueSequenceEnrollments(80);
}
