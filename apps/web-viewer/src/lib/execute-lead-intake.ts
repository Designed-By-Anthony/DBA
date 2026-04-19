import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import { generateClientId, getIdSource } from "@/lib/client-id";
import { resolveLeadAgencyId } from "@/lib/lead-webhook-agency";
import { escapeHtml } from "@/lib/email-utils";
import { insertSqlLead } from "@/lib/lead-intake/sql";
import { fireAutomationEvent } from "@/lib/automation-runner";
import { sendPushToTenantAdmins } from "@/lib/push-notify";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { getDb, withTenantContext, activities } from "@dba/database";
import type { VerticalId } from "@dba/ui";
import type { LeadIntakeResult, LeadIntakeSource } from "@/lib/lead-intake/types";

/**
 * Return the URL as-is if it parses as http(s), else `null`.
 */
function safeHttpUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

/**
 * Creates/updates prospect, activity, admin notification, optional submitter confirmation.
 * Used by /api/webhooks/lead and /api/lead.
 * Pure SQL (Drizzle + Postgres).
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

  let prospectId: string;
  let isNew = true;

  // SQL (Neon Postgres) is the sole source of truth.
  let sqlResult: { prospectId: string; isNew: boolean } | null = null;
  if (agencyId) {
    try {
      sqlResult = await insertSqlLead({
        agencyId, name, email, phone, company, website, source, message, auditUrl,
      });
    } catch (sqlErr) {
      console.error("[lead-intake] SQL insert failed; falling back to id-gen only:", sqlErr);
    }
  }

  if (sqlResult) {
    prospectId = sqlResult.prospectId;
    isNew = sqlResult.isNew;
  } else {
    prospectId = await generateClientId(getIdSource(company, name), agencyId || null);
    isNew = true;
  }

  // Write activity to SQL
  if (agencyId) {
    const db = getDb();
    if (db) {
      try {
        await withTenantContext(db, agencyId, async (tx) => {
          await tx.insert(activities).values({
            tenantId: agencyId,
            leadId: prospectId,
            type: auditUrl ? "audit_completed" : "form_submission",
            title: auditUrl
              ? `Completed a Lighthouse audit via ${source}`
              : `Submitted ${source || "website form"}`,
            description: message || null,
            metadata: {
              source,
              auditUrl: auditUrl || null,
              isNewLead: isNew,
              marketing: marketing ?? null,
            },
            createdAt: new Date().toISOString(),
          });
        });
      } catch (actErr) {
        console.error("[lead-intake] activity insert failed:", actErr);
      }
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.designedbyanthony.com";

  try {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeCompany = escapeHtml(company);
    const safeSource = escapeHtml(source || "Unknown");
    const safeMessage = escapeHtml(message);
    const safeCta = escapeHtml(marketing?.ctaSource);
    const safePageContext = escapeHtml(marketing?.pageContext);
    const safeOffer = escapeHtml(marketing?.offerType);

    const websiteUrl = safeHttpUrl(website);
    const auditUrlSafe = safeHttpUrl(auditUrl);
    const mailtoEmail = encodeURIComponent(email);

    await sendMail({
      from: `Agency OS <${complianceConfig.fromEmail}>`,
      to: [complianceConfig.adminNotificationEmail],
      subject:
        `🔔 New ${isNew ? "Lead" : "Activity"}: ` +
        `${name} ${company ? `(${company})` : ""}`.replace(/[\r\n]+/g, " "),
      html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <h2 style="margin: 0 0 16px; color: #fff;">${isNew ? "🆕 New Lead" : "🔄 Returning Contact"}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; color: #fff;">${safeName}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #fff;"><a href="mailto:${mailtoEmail}" style="color: #2563eb;">${safeEmail}</a></td></tr>
                ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; color: #fff;">${safePhone}</td></tr>` : ""}
                ${company ? `<tr><td style="padding: 8px 0; color: #888;">Company</td><td style="padding: 8px 0; color: #fff;">${safeCompany}</td></tr>` : ""}
                ${
                  websiteUrl
                    ? `<tr><td style="padding: 8px 0; color: #888;">Website</td><td style="padding: 8px 0; color: #fff;"><a href="${escapeHtml(
                        websiteUrl,
                      )}" style="color: #2563eb;">${escapeHtml(websiteUrl)}</a></td></tr>`
                    : website
                    ? `<tr><td style="padding: 8px 0; color: #888;">Website</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(website)}</td></tr>`
                    : ""
                }
                <tr><td style="padding: 8px 0; color: #888;">Source</td><td style="padding: 8px 0; color: #fff;">${safeSource}</td></tr>
                ${marketing?.ctaSource ? `<tr><td style="padding: 8px 0; color: #888;">CTA</td><td style="padding: 8px 0; color: #fff;">${safeCta}</td></tr>` : ""}
                ${marketing?.pageContext ? `<tr><td style="padding: 8px 0; color: #888;">Page context</td><td style="padding: 8px 0; color: #fff;">${safePageContext}</td></tr>` : ""}
                ${marketing?.offerType ? `<tr><td style="padding: 8px 0; color: #888;">Offer</td><td style="padding: 8px 0; color: #fff;">${safeOffer}</td></tr>` : ""}
                ${
                  auditUrlSafe
                    ? `<tr><td style="padding: 8px 0; color: #888;">Audit</td><td style="padding: 8px 0; color: #fff;"><a href="${escapeHtml(
                        auditUrlSafe,
                      )}" style="color: #2563eb;">View Report →</a></td></tr>`
                    : ""
                }
                ${message ? `<tr><td style="padding: 8px 0; color: #888;">Message</td><td style="padding: 8px 0; color: #fff;">${safeMessage}</td></tr>` : ""}
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
      const safeFirstName = escapeHtml(name.split(" ")[0] || "there");
      await sendMail({
        from: `${complianceConfig.companyName} <${complianceConfig.fromEmail}>`,
        to: [email],
        replyTo: complianceConfig.replyTo,
        subject: "We received your message",
        html: `<p>Hi ${safeFirstName},</p>
<p>Thanks for reaching out — we received your message and will get back to you soon.</p>
<p style="color:#666;font-size:13px;">— ${escapeHtml(complianceConfig.companyName)}</p>`,
      });
    } catch (e) {
      console.error("Submitter confirmation email failed:", e);
    }
  }

  // Fire the Automation Engine's `lead_created` event.
  if (isNew && agencyId) {
    let vertical: VerticalId | undefined;
    try {
      const tenant = await getTenantByOrgId(agencyId);
      vertical = (tenant?.verticalType as VerticalId) || undefined;
    } catch (err) {
      console.error("[lead-intake] tenant lookup for automation failed", err);
    }
    await fireAutomationEvent({
      trigger: "lead_created",
      tenantId: agencyId,
      prospectId,
      vertical,
      data: {
        lead: {
          name,
          email,
          phone,
          company,
          website,
          message,
          auditUrl,
          marketing: marketing ?? null,
          source,
        },
      },
    });

    // Push + in-app notification to all admin subscribers
    try {
      await sendPushToTenantAdmins(agencyId, {
        title: `🔔 New Lead: ${name}`,
        body: company ? `${name} from ${company} via ${source}` : `${name} via ${source}`,
        type: "new_lead",
        actionUrl: `/admin/prospects/${prospectId}`,
        referenceId: prospectId,
        referenceType: "lead",
      });
    } catch {
      // Non-critical — never block lead intake
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
