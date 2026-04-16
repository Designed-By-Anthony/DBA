"use server";

import { Resend } from "resend";
import { db } from "@/lib/firebase";
import type { EmailRecord } from "@/lib/types";
import {
  appendComplianceFooter,
  injectTrackingPixel,
  mergeTemplateVars,
  wrapLinksForTracking,
} from "@/lib/email-utils";
import { complianceConfig } from "@/lib/theme.config";
import { verifyAuth } from "./auth";
import { getProspect } from "./prospects";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Base URL for tracking endpoints — uses NEXTAUTH_URL in dev, or infer from headers
const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

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
    if (prospect.agencyId !== session.user.agencyId) continue;

    if (prospect.unsubscribed) {
      errors.push(`${prospect.name} has unsubscribed — skipped`);
      continue;
    }
    if (!prospect.email) {
      errors.push(`${prospect.name} has no email address — skipped`);
      continue;
    }

    const emailRef = db.collection("emails").doc();
    const emailId = emailRef.id;

    let processedBody = mergeTemplateVars(params.bodyHtml, {
      name: prospect.name.split(" ")[0],
      company: prospect.company || prospect.name,
      website: prospect.website || "",
      email: prospect.email,
    });

    processedBody = wrapLinksForTracking(processedBody, emailId, BASE_URL);
    processedBody = appendComplianceFooter(
      processedBody,
      prospectId,
      BASE_URL,
      complianceConfig.companyName,
      complianceConfig.physicalAddress,
    );
    processedBody = injectTrackingPixel(processedBody, emailId, BASE_URL);

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
      const resendPayload: {
        from: string;
        to: string;
        reply_to: string;
        subject: string;
        html: string;
        scheduledAt?: string;
      } = {
        from: `${params.fromName || complianceConfig.fromName} <${
          params.fromEmail || complianceConfig.fromEmail
        }>`,
        to: prospect.email,
        reply_to: params.fromEmail || complianceConfig.replyTo,
        subject: mergeTemplateVars(params.subject, {
          name: prospect.name.split(" ")[0],
          company: prospect.company || prospect.name,
        }),
        html: fullHtml,
      };

      if (params.scheduledAt) {
        resendPayload.scheduledAt = params.scheduledAt;
      }

      if (!resend) {
        throw new Error("Missing RESEND_API_KEY");
      }
      const result = await resend.emails.send(resendPayload);

      const emailRecord: Omit<EmailRecord, "clicks"> & { clicks: unknown[] } = {
        id: emailId,
        agencyId: session.user.agencyId,
        prospectId,
        prospectEmail: prospect.email,
        prospectName: prospect.name,
        subject: resendPayload.subject,
        bodyHtml: params.bodyHtml,
        status: params.scheduledAt ? "scheduled" : "sent",
        scheduledAt: params.scheduledAt || null,
        sentAt: params.scheduledAt ? null : new Date().toISOString(),
        resendId:
          "data" in result && result.data
            ? String((result.data as unknown as { id: string }).id)
            : null,
        opens: 0,
        clicks: [],
        createdAt: new Date().toISOString(),
      };

      await emailRef.set(emailRecord);

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

  if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

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

  try {
    await resend.emails.send({
      from: `${params.fromName || complianceConfig.fromName} <${
        params.fromEmail || complianceConfig.fromEmail
      }>`,
      to: params.testEmailAddress,
      replyTo: params.fromEmail || complianceConfig.replyTo,
      subject:
        "[TEST] " +
        mergeTemplateVars(params.subject, { name: pName, company: pCompany }),
      html: fullHtml,
    });
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

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

