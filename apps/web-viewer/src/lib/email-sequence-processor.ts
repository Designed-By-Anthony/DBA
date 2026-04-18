/**
 * Email sequence processor — pure Drizzle, no Firestore.
 * Processes active email sequence enrollments and sends the next step.
 */
import {
  getDb,
  setTenantContext,
  emailSequences,
  sequenceEnrollments,
  leads,
  emails,
} from "@dba/database";
import { eq, and, lte } from "drizzle-orm";
import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";

/**
 * Process all due sequence enrollments.
 * Called by the cron endpoint.
 */
export async function processEmailSequences(): Promise<{
  processed: number;
  sent: number;
  errors: string[];
}> {
  const db = getDb();
  if (!db) return { processed: 0, sent: 0, errors: ["Database not configured"] };

  let processed = 0;
  let sent = 0;
  const errors: string[] = [];

  try {
    const now = new Date().toISOString();

    // Find all active enrollments that are due
    const dueEnrollments = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.status, "active"),
          lte(sequenceEnrollments.nextRunAt, now),
        ),
      )
      .limit(100);

    for (const enrollment of dueEnrollments) {
      processed++;

      try {
        await setTenantContext(db, enrollment.tenantId);

        // Get the sequence
        const seqRows = await db
          .select()
          .from(emailSequences)
          .where(eq(emailSequences.id, enrollment.sequenceId))
          .limit(1);

        if (seqRows.length === 0 || !seqRows[0].isActive) {
          await db
            .update(sequenceEnrollments)
            .set({ status: "completed", updatedAt: now })
            .where(eq(sequenceEnrollments.id, enrollment.id));
          continue;
        }

        const sequence = seqRows[0];
        const steps = (sequence.steps as Array<{
          delayDays: number;
          subject: string;
          bodyHtml: string;
        }>) || [];

        if (enrollment.stepIndex >= steps.length) {
          await db
            .update(sequenceEnrollments)
            .set({ status: "completed", updatedAt: now })
            .where(eq(sequenceEnrollments.id, enrollment.id));
          continue;
        }

        const step = steps[enrollment.stepIndex];

        // Get the lead
        if (!enrollment.leadId) continue;
        const leadRows = await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.tenantId, enrollment.tenantId),
              eq(leads.prospectId, enrollment.leadId),
            ),
          )
          .limit(1);

        if (leadRows.length === 0) continue;
        const lead = leadRows[0];

        if (lead.unsubscribed || !lead.email) continue;

        // Send the email
        const result = await sendMail({
          from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
          to: lead.email,
          replyTo: complianceConfig.replyTo,
          subject: step.subject.replace(/\{\{name\}\}/g, lead.name.split(" ")[0]),
          html: step.bodyHtml.replace(/\{\{name\}\}/g, lead.name.split(" ")[0]),
        });

        if (result.ok) {
          sent++;

          // Record the email
          await db.insert(emails).values({
            tenantId: enrollment.tenantId,
            leadId: enrollment.leadId,
            leadEmail: lead.email,
            leadName: lead.name,
            subject: step.subject,
            bodyHtml: step.bodyHtml,
            status: "sent",
            sentAt: now,
            createdAt: now,
          });
        }

        // Advance to next step
        const nextStepIndex = enrollment.stepIndex + 1;
        if (nextStepIndex >= steps.length) {
          await db
            .update(sequenceEnrollments)
            .set({ status: "completed", stepIndex: nextStepIndex, updatedAt: now })
            .where(eq(sequenceEnrollments.id, enrollment.id));
        } else {
          const nextStep = steps[nextStepIndex];
          const nextRunDate = new Date();
          nextRunDate.setDate(nextRunDate.getDate() + (nextStep.delayDays || 1));
          await db
            .update(sequenceEnrollments)
            .set({
              stepIndex: nextStepIndex,
              nextRunAt: nextRunDate.toISOString(),
              updatedAt: now,
            })
            .where(eq(sequenceEnrollments.id, enrollment.id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Enrollment ${enrollment.id}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`processEmailSequences: ${msg}`);
  }

  return { processed, sent, errors };
}
