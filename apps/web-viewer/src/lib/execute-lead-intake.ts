import { db } from "@/lib/firebase";
import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import { generateClientId, getIdSource } from "@/lib/client-id";
import { resolveLeadAgencyId } from "@/lib/lead-webhook-agency";
import type { LeadIntakeResult, LeadIntakeSource } from "@/lib/lead-intake/types";

/**
 * Creates/updates prospect, activity, admin notification, optional submitter confirmation.
 * Used by /api/webhooks/lead and /api/lead.
 */
export async function executeLeadIntake(fields: LeadIntakeSource): Promise<LeadIntakeResult> {
  const agencyId = await resolveLeadAgencyId(fields.agencyId);
  if (!agencyId && process.env.NODE_ENV === "production") {
    console.error(
      "[lead-intake] resolvedAgencyId is empty — CRM uses Clerk org id. Set LEAD_WEBHOOK_DEFAULT_AGENCY_ID or pass agencyId.",
    );
  }

  const name = String(fields.name || "").trim();
  const email = String(fields.email || "").trim();
  const phone = fields.phone ? String(fields.phone).trim() : "";
  const company = fields.company ? String(fields.company).trim() : "";
  const website = String(fields.website || "").trim();
  const source = String(fields.source || "unknown");
  const message = String(fields.message || "").trim();
  const auditUrl = String(fields.auditUrl || "").trim();
  const marketing = fields.marketing;

  if (!name || !email) {
    throw new Error("Name and email are required");
  }

  let existing;
  try {
    existing = await db
      .collection("prospects")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();
  } catch {
    existing = null;
  }

  let prospectId: string;
  let isNew = true;

  if (existing && !existing.empty) {
    prospectId = existing.docs[0].id;
    isNew = false;

    const emailNorm = email.toLowerCase().trim();
    await db.collection("prospects").doc(prospectId).update({
      lastContactedAt: new Date().toISOString(),
      emailNormalized: emailNorm,
      notes:
        (existing.docs[0].data().notes || "") +
        `\n[${new Date().toLocaleDateString()}] Re-engaged via ${source}: ${message || "No message"}`,
    });
  } else {
    const idSource = getIdSource(company, name);
    prospectId = await generateClientId(idSource);

    const emailNorm = email.toLowerCase().trim();
    await db.collection("prospects").doc(prospectId).set({
      agencyId,
      name: name.trim(),
      email: emailNorm,
      emailNormalized: emailNorm,
      phone: phone?.trim() || "",
      company: company?.trim() || "",
      website: website?.trim() || "",
      targetUrl: website?.trim() || "",
      status: "lead",
      dealValue: 0,
      source: source || "Website Form",
      tags: auditUrl ? ["Audit Completed"] : [],
      notes: message || "",
      assignedTo: "",
      createdAt: new Date().toISOString(),
      lastContactedAt: new Date().toISOString(),
      unsubscribed: false,
      auditReportUrl: auditUrl || null,
    });
  }

  await db.collection("activities").add({
    agencyId,
    prospectId,
    type: auditUrl ? "audit_completed" : "form_submission",
    title: auditUrl
      ? `Completed a Lighthouse audit via ${source}`
      : `Submitted ${source || "website form"}`,
    description: message || "",
    metadata: {
      source,
      auditUrl: auditUrl || null,
      isNewLead: isNew,
      marketing: marketing || null,
    },
    createdAt: new Date().toISOString(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.designedbyanthony.com";

  try {
    await sendMail({
      from: `Agency OS <${complianceConfig.fromEmail}>`,
      to: [complianceConfig.adminNotificationEmail],
      subject: `🔔 New ${isNew ? "Lead" : "Activity"}: ${name} ${company ? `(${company})` : ""}`,
      html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
            <h2 style="margin: 0 0 16px; color: #fff;">${isNew ? "🆕 New Lead" : "🔄 Returning Contact"}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; color: #fff;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #fff;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; color: #fff;">${phone}</td></tr>` : ""}
              ${company ? `<tr><td style="padding: 8px 0; color: #888;">Company</td><td style="padding: 8px 0; color: #fff;">${company}</td></tr>` : ""}
              ${website ? `<tr><td style="padding: 8px 0; color: #888;">Website</td><td style="padding: 8px 0; color: #fff;"><a href="${website}" style="color: #2563eb;">${website}</a></td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #888;">Source</td><td style="padding: 8px 0; color: #fff;">${source || "Unknown"}</td></tr>
              ${marketing?.ctaSource ? `<tr><td style="padding: 8px 0; color: #888;">CTA</td><td style="padding: 8px 0; color: #fff;">${marketing.ctaSource}</td></tr>` : ""}
              ${marketing?.pageContext ? `<tr><td style="padding: 8px 0; color: #888;">Page context</td><td style="padding: 8px 0; color: #fff;">${marketing.pageContext}</td></tr>` : ""}
              ${marketing?.offerType ? `<tr><td style="padding: 8px 0; color: #888;">Offer</td><td style="padding: 8px 0; color: #fff;">${marketing.offerType}</td></tr>` : ""}
              ${auditUrl ? `<tr><td style="padding: 8px 0; color: #888;">Audit</td><td style="padding: 8px 0; color: #fff;"><a href="${auditUrl}" style="color: #2563eb;">View Report →</a></td></tr>` : ""}
              ${message ? `<tr><td style="padding: 8px 0; color: #888;">Message</td><td style="padding: 8px 0; color: #fff;">${message}</td></tr>` : ""}
            </table>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
              <a href="${appUrl}/admin/prospects/${prospectId}" 
                style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                View in Agency OS →
              </a>
            </div>
          </div>
        `,
    });
  } catch (emailErr) {
    console.error("Lead notification email failed:", emailErr);
  }

  if (process.env.LEAD_SEND_SUBMITTER_CONFIRMATION === "true") {
    try {
      await sendMail({
        from: `${complianceConfig.companyName} <${complianceConfig.fromEmail}>`,
        to: [email],
        replyTo: complianceConfig.replyTo,
        subject: "We received your message",
        html: `<p>Hi ${name.split(" ")[0] || "there"},</p>
<p>Thanks for reaching out — we received your message and will get back to you soon.</p>
<p style="color:#666;font-size:13px;">— ${complianceConfig.companyName}</p>`,
      });
    } catch (e) {
      console.error("Submitter confirmation email failed:", e);
    }
  }

  return {
    success: true,
    prospectId,
    isNew,
    agencyId,
    message: isNew ? "New prospect created" : "Existing prospect updated",
  };
}
