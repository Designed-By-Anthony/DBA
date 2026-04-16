"use server";

import { db } from "@/lib/firebase";
import type { CrmTask } from "@/lib/types";
import { verifyAuth } from "./auth";
import { ensureOwnership } from "../action-helpers";

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

export async function deleteCrmTask(
  prospectId: string,
  taskId: string,
): Promise<{ success: boolean }> {
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

