"use server";

import { db } from "@/lib/firebase";
import type { Activity, ActivityType } from "@/lib/types";
import { evaluateProspectHealth, recalculateLeadScore } from "@/lib/intelligence";
import { processAutomations } from "@/lib/automations";
import { verifyAuth } from "./auth";
import { ensureOwnership } from "../action-helpers";

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
  metadata?: Record<string, unknown>,
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

  await recalculateLeadScore(prospectId);
  await evaluateProspectHealth(prospectId);
  await processAutomations(session.user.agencyId, prospectId, "activity_added", { type });
}

export async function addNote(prospectId: string, note: string): Promise<void> {
  const session = await verifyAuth();
  if (!note.trim()) return;

  await ensureOwnership("prospects", prospectId, session.user.agencyId);

  await addActivity(prospectId, "note_added", "Note added", note);

  const doc = await db.collection("prospects").doc(prospectId).get();
  if (doc.exists) {
    const existing = doc.data()?.notes || "";
    await db.collection("prospects").doc(prospectId).update({
      notes: existing
        ? `${existing}\n[${new Date().toLocaleDateString()}] ${note}`
        : note,
    });
  }
}

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
      createdAt:
        d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  });
}

