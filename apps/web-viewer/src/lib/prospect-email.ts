/**
 * Single-recipient transactional / automation emails (sequences, automations).
 * Mirrors the core pipeline in sendEmail but callable from cron and automations.
 */
import { db } from "@/lib/firebase";
import { Resend } from "resend";
import {
  appendComplianceFooter,
  injectTrackingPixel,
  mergeTemplateVars,
  wrapLinksForTracking,
} from "@/lib/email-utils";
import { complianceConfig } from "@/lib/theme.config";
import type { EmailRecord } from "@/lib/types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendProspectEmailFromTemplate(params: {
  agencyId: string;
  prospectId: string;
  subject: string;
  bodyHtml: string;
}): Promise<{ ok: boolean; error?: string }> {
  const doc = await db.collection("prospects").doc(params.prospectId).get();
  if (!doc.exists) return { ok: false, error: "Prospect not found" };
  const data = doc.data()!;
  if (data.agencyId !== params.agencyId) {
    return { ok: false, error: "Tenant mismatch" };
  }
  if (data.unsubscribed) return { ok: false, error: "Prospect unsubscribed" };
  const email = data.email as string;
  if (!email?.trim()) return { ok: false, error: "No email" };

  const name = (data.name as string) || "there";
  const company = (data.company as string) || name;

  const emailRef = db.collection("emails").doc();
  const emailId = emailRef.id;

  let processedBody = mergeTemplateVars(params.bodyHtml, {
    name: name.split(" ")[0],
    company,
    website: (data.website as string) || "",
    email,
  });
  processedBody = wrapLinksForTracking(processedBody, emailId, BASE_URL);
  processedBody = appendComplianceFooter(
    processedBody,
    params.prospectId,
    BASE_URL,
    complianceConfig.companyName,
    complianceConfig.physicalAddress,
  );
  processedBody = injectTrackingPixel(processedBody, emailId, BASE_URL);

  const fullHtml = `<!DOCTYPE html>
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

  const subjectLine = mergeTemplateVars(params.subject, {
    name: name.split(" ")[0],
    company,
  });

  if (!resend) return { ok: false, error: "Missing RESEND_API_KEY" };

  try {
    const result = await resend.emails.send({
      from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
      to: email,
      replyTo: complianceConfig.replyTo,
      subject: subjectLine,
      html: fullHtml,
    });

    const emailRecord: Omit<EmailRecord, "clicks"> & { clicks: unknown[] } = {
      id: emailId,
      agencyId: params.agencyId,
      prospectId: params.prospectId,
      prospectEmail: email,
      prospectName: name,
      subject: subjectLine,
      bodyHtml: params.bodyHtml,
      status: "sent",
      scheduledAt: null,
      sentAt: new Date().toISOString(),
      resendId: "data" in result && result.data ? String((result.data as { id: string }).id) : null,
      opens: 0,
      clicks: [],
      createdAt: new Date().toISOString(),
    };

    await emailRef.set(emailRecord as Record<string, unknown>);

    await db.collection("prospects").doc(params.prospectId).update({
      lastContactedAt: new Date().toISOString(),
      ...(data.status === "lead" ? { status: "contacted" } : {}),
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
