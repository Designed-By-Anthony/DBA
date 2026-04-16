import { db } from "@/lib/firebase";
import { sendProspectEmailFromTemplate } from "@/lib/prospect-email";
import type { EmailSequenceDefinition, SequenceEnrollment } from "@/lib/types";

function toEnrollment(id: string, data: FirebaseFirestore.DocumentData): SequenceEnrollment {
  return {
    id,
    agencyId: data.agencyId,
    prospectId: data.prospectId,
    sequenceId: data.sequenceId,
    stepIndex: data.stepIndex ?? 0,
    nextRunAt: data.nextRunAt,
    status: data.status,
    enrolledAt: data.enrolledAt,
  };
}

export async function processDueSequenceEnrollments(
  maxBatch: number = 50,
): Promise<{ processed: number; errors: string[] }> {
  const nowIso = new Date().toISOString();
  const errors: string[] = [];
  let processed = 0;

  const snap = await db
    .collection("sequence_enrollments")
    .where("status", "==", "active")
    .where("nextRunAt", "<=", nowIso)
    .limit(maxBatch)
    .get();

  for (const doc of snap.docs) {
    const en = toEnrollment(doc.id, doc.data());
    try {
      const seqRef = await db.collection("email_sequences").doc(en.sequenceId).get();
      if (!seqRef.exists) {
        await doc.ref.update({ status: "cancelled", updatedAt: new Date().toISOString() });
        continue;
      }
      const seq = seqRef.data() as EmailSequenceDefinition;
      if (!seq.isActive || seq.agencyId !== en.agencyId) {
        await doc.ref.update({ status: "cancelled", updatedAt: new Date().toISOString() });
        continue;
      }

      const steps = seq.steps || [];
      if (en.stepIndex >= steps.length) {
        await doc.ref.update({
          status: "completed",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      const step = steps[en.stepIndex];
      const send = await sendProspectEmailFromTemplate({
        agencyId: en.agencyId,
        prospectId: en.prospectId,
        subject: step.subject,
        bodyHtml: step.bodyHtml,
      });

      if (!send.ok) {
        errors.push(`${doc.id}: ${send.error || "send failed"}`);
        continue;
      }

      processed++;

      const nextIndex = en.stepIndex + 1;
      if (nextIndex >= steps.length) {
        await doc.ref.update({
          status: "completed",
          completedAt: new Date().toISOString(),
          stepIndex: nextIndex,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const delayH = steps[nextIndex]?.delayHours ?? 0;
        const nextRun = new Date(Date.now() + delayH * 60 * 60 * 1000).toISOString();
        await doc.ref.update({
          stepIndex: nextIndex,
          nextRunAt: nextRun,
          lastSentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e: unknown) {
      errors.push(`${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, errors };
}

/** First step uses steps[0].delayHours as delay before that email; enrollment nextRunAt already set at enroll time. */
export function computeInitialNextRunAt(
  steps: EmailSequenceDefinition["steps"],
): string {
  const h = steps[0]?.delayHours ?? 0;
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}
