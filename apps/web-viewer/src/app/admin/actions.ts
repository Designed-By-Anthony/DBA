/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use server";

import "@dba/env/web-viewer-aliases";
import { auth, currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { sendMail } from "@/lib/mailer";
import {
  wrapLinksForTracking,
  appendComplianceFooter,
  escapeHtml,
  injectTrackingPixel,
  mergeTemplateVars,
} from "@/lib/email-utils";
import { complianceConfig } from "@/lib/theme.config";
import {
  getDb,
  withTenantContext,
  leads,
  emails,
  tickets,
  activities,
  automations,
  tasks,
  notifications,
  type LeadRow,
  type EmailRow,
  type ActivityRow,
  type TaskRow,
  type NotificationRow,
  type Database,
} from "@dba/database";
import { eq, and, desc, asc, sql, count, sum, or, ilike, inArray, lte, isNotNull } from "drizzle-orm";
import type {
  Prospect,
  EmailRecord,
  ClickEvent,
  DashboardStats,
  ProspectStatus,
  ProspectHealthStatus,
  Activity,
  ActivityType,
  QuotePackage,
  CrmTask,
} from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { generateClientId, getIdSource } from "@/lib/client-id";
import { isTestMode } from "@/lib/test-mode";

// Base URL for tracking endpoints
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================
// Auth Helpers (Clerk)
// ============================================
type DevSession = {
  user: { id: string; email: string; agencyId: string; role: "owner" | "admin" | "member" };
};

export async function verifyAuth(): Promise<DevSession> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return { user: { id: "dev", email: "dev@local", agencyId: "dev-agency", role: "owner" } };
    }
    throw new Error("Unauthorized: No active session or organization");
  }

  // Map Clerk orgRole to our internal role format
  let role: "owner" | "admin" | "member" = "member";
  if (orgRole === "org:admin") role = "owner";
  else if (orgRole === "org:member") role = "member";

  // Get email from Clerk only when needed (lazy)
  let email = "";
  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress || "";
  } catch {
    // Non-critical — email is only needed for specific actions
  }

  // Set Sentry user context — every error tagged with who triggered it
  Sentry.setUser({ id: userId, email, segment: orgId });
  Sentry.setTag("orgId", orgId);
  Sentry.setTag("orgRole", role);

  return {
    user: { id: userId, email, agencyId: orgId, role }
  };
}

// ============================================
// Tenant Context Helper
// ============================================

type TenantTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function withTenant<T>(
  fn: (tx: TenantTx, tenantId: string) => Promise<T>,
  onUnavailable?: () => T | Promise<T>,
): Promise<T> {
  let session: DevSession;
  try {
    session = await verifyAuth();
  } catch (err) {
    Sentry.captureException(err);
    if (onUnavailable) return await onUnavailable();
    throw err;
  }

  if (session.user.id === "dev") {
    if (onUnavailable) return await onUnavailable();
    throw new Error("Sign in with Clerk to use the CRM.");
  }

  const tenantId = session.user.agencyId;
  if (!tenantId) {
    if (onUnavailable) return await onUnavailable();
    throw new Error("Missing organization context.");
  }

  const db = getDb();
  if (!db) {
    if (onUnavailable) return await onUnavailable();
    throw new Error("Database not configured");
  }

  try {
    return await withTenantContext(db, tenantId, async (tx) => fn(tx, tenantId));
  } catch (err) {
    Sentry.captureException(err);
    if (onUnavailable) return await onUnavailable();
    throw err;
  }
}

// ============================================
// Prospect Mapper
// ============================================
function leadRowToProspect(row: LeadRow): Prospect {
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const phone = (row.phone || String(meta.phone ?? "") || "").trim();
  const company = row.company || String(meta.company ?? "").trim() || "";
  const website = row.website || String(meta.website ?? meta.targetUrl ?? "").trim() || "";
  const notes = row.notes || String(meta.message ?? meta.biggest_issue ?? "").trim() || "";
  const auditUrl =
    typeof meta.auditUrl === "string" && meta.auditUrl.trim() ? meta.auditUrl.trim() : null;
  const raw = row.status || "new";
  const status: ProspectStatus = raw === "new" ? "lead" : (raw as ProspectStatus);

  return {
    id: row.prospectId,
    agencyId: row.tenantId,
    name: row.name || "",
    email: row.email || "",
    phone,
    company,
    website,
    targetUrl: website,
    status,
    dealValue: (row.dealValue || 0) / 100, // Convert from cents
    source: row.source?.trim() || "marketing_site",
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes,
    assignedTo: row.assignedTo || "",
    createdAt: row.createdAt,
    lastContactedAt: row.lastContactedAt || null,
    unsubscribed: row.unsubscribed || false,
    auditReportUrl: auditUrl,
    emailNormalized: row.emailNormalized,
    contractDocUrl: row.contractDocUrl || undefined,
    driveFolderUrl: row.driveFolderUrl || undefined,
    contractSigned: row.contractSigned || false,
    contractStatus: (row.contractStatus as Prospect["contractStatus"]) || undefined,
    stripeCustomerId: row.stripeCustomerId || undefined,
    pricingTier: (row.pricingTier as Prospect["pricingTier"]) || undefined,
    projectNotes: row.projectNotes || undefined,
    fcmToken: row.fcmToken || undefined,
    leadScore: row.leadScore || undefined,
    healthStatus: (row.healthStatus as ProspectHealthStatus) || undefined,
  };
}

const STALE_LEAD_DAYS = 14;

// ============================================
// Prospect CRUD
// ============================================

export async function getProspects(): Promise<Prospect[]> {
  return await withTenant(
    async (db, tenantId) => {
      const rows = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, tenantId))
        .orderBy(desc(leads.createdAt))
        .limit(200);

      return rows.map(leadRowToProspect);
    },
    () => [],
  );
}

export async function getProspect(id: string): Promise<Prospect | null> {
  return withTenant(async (db, tenantId) => {
    const row = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, id)
      ))
      .limit(1);

    return row.length > 0 ? leadRowToProspect(row[0]) : null;
  }, () => null);
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
  return withTenant(async (db, tenantId) => {
    const emailNorm = data.email.trim().toLowerCase();

    // Check for duplicate
    const existing = await db
      .select({ prospectId: leads.prospectId })
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.emailNormalized, emailNorm)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "duplicate_email", duplicateOfId: existing[0].prospectId };
    }

    // Generate prospect ID
    const idSource = getIdSource(data.company, data.name);
    const prospectId = await generateClientId(idSource, tenantId);

    const now = new Date().toISOString();
    await db.insert(leads).values({
      tenantId,
      prospectId,
      name: data.name,
      email: data.email,
      emailNormalized: emailNorm,
      phone: data.phone || null,
      company: data.company || null,
      website: data.website || null,
      targetUrl: data.targetUrl || null,
      dealValue: Math.round((data.dealValue || 0) * 100), // Convert to cents
      source: data.source || "marketing_site",
      tags: data.tags || [],
      notes: data.notes || null,
      assignedTo: null,
      status: data.status || "new",
      lastContactedAt: null,
      unsubscribed: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id: prospectId };
  });
}

export async function updateProspect(
  id: string,
  fields: Partial<Omit<Prospect, "id" | "createdAt" | "agencyId">>,
): Promise<{ success: boolean; error?: "duplicate_email" }> {
  return withTenant(async (db, tenantId) => {
    // Verify ownership
    const existing = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, id)
      ))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Prospect not found");
    }

    const existingRow = existing[0];
    const oldStatus = existingRow.status;

    // Check for duplicate email if changed
    if (fields.email !== undefined) {
      const emailNorm = fields.email.trim().toLowerCase();
      const dup = await db
        .select({ prospectId: leads.prospectId })
        .from(leads)
        .where(and(
          eq(leads.tenantId, tenantId),
          eq(leads.emailNormalized, emailNorm),
          // Don't match self
        ))
        .limit(1);

      if (dup.length > 0 && dup[0].prospectId !== id) {
        return { success: false, error: "duplicate_email" };
      }
    }

    // Build update payload
    const payload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (fields.name !== undefined) payload.name = fields.name;
    if (fields.email !== undefined) {
      payload.email = fields.email;
      payload.emailNormalized = fields.email.trim().toLowerCase();
    }
    if (fields.phone !== undefined) payload.phone = fields.phone || null;
    if (fields.company !== undefined) payload.company = fields.company || null;
    if (fields.website !== undefined) payload.website = fields.website || null;
    if (fields.targetUrl !== undefined) payload.targetUrl = fields.targetUrl || null;
    if (fields.dealValue !== undefined) payload.dealValue = Math.round(fields.dealValue * 100);
    if (fields.source !== undefined) payload.source = fields.source || null;
    if (fields.tags !== undefined) payload.tags = fields.tags || [];
    if (fields.notes !== undefined) payload.notes = fields.notes || null;
    if (fields.assignedTo !== undefined) payload.assignedTo = fields.assignedTo || null;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.lastContactedAt !== undefined) payload.lastContactedAt = fields.lastContactedAt || null;
    if (fields.unsubscribed !== undefined) payload.unsubscribed = fields.unsubscribed;
    if (fields.contractDocUrl !== undefined) payload.contractDocUrl = fields.contractDocUrl || null;
    if (fields.driveFolderUrl !== undefined) payload.driveFolderUrl = fields.driveFolderUrl || null;
    if (fields.contractSigned !== undefined) payload.contractSigned = fields.contractSigned;
    if (fields.contractStatus !== undefined) payload.contractStatus = fields.contractStatus || null;
    if (fields.stripeCustomerId !== undefined) payload.stripeCustomerId = fields.stripeCustomerId || null;
    if (fields.pricingTier !== undefined) payload.pricingTier = fields.pricingTier || null;
    if (fields.projectNotes !== undefined) payload.projectNotes = fields.projectNotes || null;
    if (fields.fcmToken !== undefined) payload.fcmToken = fields.fcmToken || null;

    await db
      .update(leads)
      .set(payload)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, id)
      ));

    // Handle status change automation
    if (fields.status && oldStatus !== fields.status) {
      await createActivity(
        tenantId,
        id,
        "status_change",
        "Status changed",
        `Status changed from ${oldStatus} to ${fields.status}`,
        { oldStatus, newStatus: fields.status }
      );

      // Insert notification
      await db.insert(notifications).values({
        tenantId,
        title: "Prospect Status Updated",
        body: `${existingRow.name} status changed to ${fields.status}`,
        type: "lead",
        referenceId: id,
        referenceType: "lead",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true };
  });
}

export async function deleteProspect(id: string): Promise<{ success: boolean }> {
  return withTenant(async (db, tenantId) => {
    // Verify ownership
    const existing = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, id)
      ))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Prospect not found");
    }

    await db
      .delete(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, id)
      ));

    return { success: true };
  });
}

export async function bulkDeleteProspects(ids: string[]): Promise<{ success: boolean }> {
  return withTenant(async (db, tenantId) => {
    for (const id of ids) {
      await deleteProspect(id);
    }
    return { success: true };
  });
}

export async function bulkUpdateStatus(
  ids: string[],
  newStatus: ProspectStatus
): Promise<{ success: boolean }> {
  return withTenant(async (db, tenantId) => {
    await db
      .update(leads)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where(and(
        eq(leads.tenantId, tenantId),
        inArray(leads.prospectId, ids)
      ));

    return { success: true };
  });
}

export async function findDuplicateProspectByEmail(
  email: string,
): Promise<{ id: string; name: string } | null> {
  return withTenant(async (db, tenantId) => {
    const emailNorm = email.trim().toLowerCase();

    const result = await db
      .select({ prospectId: leads.prospectId, name: leads.name })
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.emailNormalized, emailNorm)
      ))
      .limit(1);

    if (result.length === 0) return null;
    return { id: result[0].prospectId, name: result[0].name || "" };
  }, () => null);
}

// ============================================
// Email Sending
// ============================================

export async function sendEmail(params: {
  prospectIds: string[];
  subject: string;
  bodyHtml: string;
  fromName?: string;
  fromEmail?: string;
  scheduledAt?: string | null;
}): Promise<{ success: boolean; sent: number; errors: string[] }> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;

  const errors: string[] = [];
  let sent = 0;

  for (const prospectId of params.prospectIds) {
    const prospect = await getProspect(prospectId);
    if (!prospect) {
      errors.push(`Prospect ${prospectId} not found`);
      continue;
    }

    if (prospect.unsubscribed) {
      errors.push(`${prospect.name} has unsubscribed — skipped`);
      continue;
    }
    if (!prospect.email) {
      errors.push(`${prospect.name} has no email address — skipped`);
      continue;
    }

    const emailId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

    // Merge template variables
    let processedBody = mergeTemplateVars(params.bodyHtml, {
      name: escapeHtml(prospect.name.split(" ")[0]),
      company: escapeHtml(prospect.company || prospect.name),
      website: escapeHtml(prospect.website || ""),
      email: escapeHtml(prospect.email),
    });

    // Process body
    processedBody = wrapLinksForTracking(processedBody, emailId, BASE_URL);
    processedBody = appendComplianceFooter(
      processedBody,
      prospectId,
      BASE_URL,
      complianceConfig.companyName,
      complianceConfig.physicalAddress
    );
    processedBody = injectTrackingPixel(processedBody, emailId, BASE_URL);

    // Wrap in styled container
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
      const subjectLine = mergeTemplateVars(params.subject, {
        name: prospect.name.split(" ")[0],
        company: prospect.company || prospect.name,
      });

      const result = await sendMail({
        from: `${params.fromName || complianceConfig.fromName} <${params.fromEmail || complianceConfig.fromEmail}>`,
        to: prospect.email,
        replyTo: params.fromEmail || complianceConfig.replyTo,
        subject: subjectLine.replace(/[\r\n]+/g, " "),
        html: fullHtml,
        ...(params.scheduledAt ? { scheduledAt: params.scheduledAt } : {}),
      });

      if (!result.ok) {
        errors.push(`Failed to send to ${prospect.name}: ${result.error}`);
        continue;
      }

      // Insert email record
      const db = getDb();
      if (db) {
        await withTenantContext(db, tenantId, async (tx) => {
          const now = new Date().toISOString();
          await tx.insert(emails).values({
            tenantId,
            leadId: prospectId,
            leadEmail: prospect.email,
            leadName: prospect.name,
            subject: subjectLine,
            bodyHtml: params.bodyHtml,
            status: params.scheduledAt ? "scheduled" : "sent",
            scheduledAt: params.scheduledAt || null,
            sentAt: params.scheduledAt ? null : now,
            resendId: result.mode === "resend" ? result.id : null,
            opens: 0,
            clicks: [],
            createdAt: now,
          });

          // Update prospect's last contacted date and status if needed
          await tx
            .update(leads)
            .set({
              lastContactedAt: now,
              ...(prospect.status === "lead" ? { status: "contacted" } : {}),
              updatedAt: now,
            })
            .where(and(
              eq(leads.tenantId, tenantId),
              eq(leads.prospectId, prospectId)
            ));
        });
      }

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
    name: escapeHtml(pName),
    company: escapeHtml(pCompany),
    website: escapeHtml(pWebsite),
    email: escapeHtml(params.testEmailAddress),
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

  const result = await sendMail({
    from: `${params.fromName || complianceConfig.fromName} <${params.fromEmail || complianceConfig.fromEmail}>`,
    to: params.testEmailAddress,
    replyTo: params.fromEmail || complianceConfig.replyTo,
    subject: `[TEST] ` + mergeTemplateVars(params.subject, {
      name: pName.replace(/[\r\n]+/g, " "),
      company: pCompany.replace(/[\r\n]+/g, " "),
    }),
    html: fullHtml,
  });

  if (!result.ok) return { success: false, error: result.error };
  return { success: true };
}

// ============================================
// Email History
// ============================================

const EMAIL_STATUSES = new Set(["draft", "scheduled", "sent", "failed"]);

function normalizeEmailStatus(raw: string | null | undefined): EmailRecord["status"] {
  if (raw && EMAIL_STATUSES.has(raw)) return raw as EmailRecord["status"];
  return "sent";
}

function normalizeClickEvents(raw: unknown): ClickEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c): ClickEvent => {
    if (c && typeof c === "object") {
      const o = c as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url : "";
      const clickedAt = typeof o.clickedAt === "string" ? o.clickedAt : new Date().toISOString();
      const userAgent = typeof o.userAgent === "string" ? o.userAgent : "";
      return { url, clickedAt, userAgent };
    }
    return { url: "", clickedAt: new Date().toISOString(), userAgent: "" };
  });
}

export async function getEmailHistory(prospectId?: string): Promise<EmailRecord[]> {
  return withTenant(async (db, tenantId) => {
    try {
      let query = db
        .select()
        .from(emails)
        .where(eq(emails.tenantId, tenantId))
        .orderBy(desc(emails.createdAt))
        .limit(100);

      if (prospectId) {
        query = db
          .select()
          .from(emails)
          .where(and(
            eq(emails.tenantId, tenantId),
            eq(emails.leadId, prospectId)
          ))
          .orderBy(desc(emails.createdAt))
          .limit(100);
      }

      const rows = await query;
      return rows.map((row: EmailRow) => ({
        id: row.id,
        agencyId: row.tenantId,
        prospectId: row.leadId,
        prospectEmail: row.leadEmail,
        prospectName: row.leadName || "",
        subject: row.subject,
        bodyHtml: row.bodyHtml,
        status: normalizeEmailStatus(row.status),
        scheduledAt: row.scheduledAt,
        sentAt: row.sentAt,
        resendId: row.resendId,
        opens: row.opens ?? 0,
        clicks: normalizeClickEvents(row.clicks),
        createdAt: row.createdAt,
      }));
    } catch (err) {
      console.error("getEmailHistory error:", err);
      return [];
    }
  }, () => []);
}

// ============================================
// Dashboard Stats
// ============================================

const probByStatus: Record<ProspectStatus, number> = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.probability]),
) as Record<ProspectStatus, number>;

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalProspects: 0,
  prospectsByStatus: { lead: 0, contacted: 0, proposal: 0, dev: 0, launched: 0 },
  emailsSent: 0,
  emailsScheduled: 0,
  totalOpens: 0,
  totalClicks: 0,
  pipelineValue: 0,
  forecastedMrr: 0,
  weightedPipelineValue: 0,
  staleLeadCount: 0,
  overdueOpenTasksCount: 0,
  pipelineVelocityDays: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return withTenant(async (db, tenantId) => {
    try {
      // Get all leads for this tenant
      const prospectRows = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, tenantId));

      // Get email counts
      const sentEmailResult = await db
        .select({ count: count() })
        .from(emails)
        .where(and(
          eq(emails.tenantId, tenantId),
          eq(emails.status, "sent")
        ));

      const scheduledEmailResult = await db
        .select({ count: count() })
        .from(emails)
        .where(and(
          eq(emails.tenantId, tenantId),
          eq(emails.status, "scheduled")
        ));

      const nowIso = new Date().toISOString();
      const overdueTaskResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(and(
          eq(tasks.tenantId, tenantId),
          eq(tasks.completed, false),
          isNotNull(tasks.dueAt),
          lte(tasks.dueAt, nowIso),
        ));

      // Process prospects
      const statusCounts: Record<ProspectStatus, number> = {
        lead: 0,
        contacted: 0,
        proposal: 0,
        dev: 0,
        launched: 0,
      };

      let pipelineValue = 0;
      let weightedPipelineValue = 0;
      let totalVelocityDays = 0;
      let launchedCount = 0;
      const nowMs = Date.now();
      const staleMs = STALE_LEAD_DAYS * 24 * 60 * 60 * 1000;
      let staleLeadCount = 0;

      prospectRows.forEach((p: any) => {
        const mappedStatus = (p.status || "lead") as ProspectStatus;
        if (statusCounts[mappedStatus as ProspectStatus] !== undefined) {
          statusCounts[mappedStatus as ProspectStatus]++;
        }

        const deal = (p.dealValue || 0) / 100;
        if (mappedStatus !== "launched") {
          pipelineValue += deal;
          const prob = probByStatus[mappedStatus as ProspectStatus] ?? 0.1;
          weightedPipelineValue += deal * prob;
        } else {
          launchedCount++;
          const createdAtMs = new Date(p.createdAt).getTime();
          const days = Math.floor((nowMs - createdAtMs) / (1000 * 60 * 60 * 24));
          totalVelocityDays += Math.max(1, days);
        }

        if (mappedStatus !== "launched") {
          const lastTouch = p.lastContactedAt
            ? new Date(p.lastContactedAt).getTime()
            : new Date(p.createdAt).getTime();
          if (nowMs - lastTouch > staleMs) staleLeadCount++;
        }
      });

      const emailSentCount = sentEmailResult[0]?.count || 0;
      const emailScheduledCount = scheduledEmailResult[0]?.count || 0;
      const overdueTaskCount = overdueTaskResult[0]?.count || 0;

      const roundedWeighted = Math.round(weightedPipelineValue);

      return {
        totalProspects: prospectRows.length,
        prospectsByStatus: statusCounts,
        emailsSent: emailSentCount,
        emailsScheduled: emailScheduledCount,
        totalOpens: 0,
        totalClicks: 0,
        pipelineValue,
        forecastedMrr: roundedWeighted,
        weightedPipelineValue: roundedWeighted,
        staleLeadCount,
        overdueOpenTasksCount: overdueTaskCount,
        pipelineVelocityDays: launchedCount > 0 ? Math.round(totalVelocityDays / launchedCount) : 0,
      };
    } catch (err) {
      console.error("getDashboardStats error:", err);
      return { ...EMPTY_DASHBOARD_STATS };
    }
  }, () => EMPTY_DASHBOARD_STATS);
}

// ============================================
// CRM Tasks
// ============================================

function taskFromRow(row: TaskRow): CrmTask {
  return {
    id: row.id,
    prospectId: row.leadId || "",
    agencyId: row.tenantId,
    title: row.title,
    dueAt: row.dueAt || new Date().toISOString(),
    completed: row.completed,
    createdAt: row.createdAt,
  };
}

export async function getCrmTasksForProspect(prospectId: string): Promise<CrmTask[]> {
  return withTenant(async (db, tenantId) => {
    // Verify prospect exists
    const prospect = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, prospectId)
      ))
      .limit(1);

    if (prospect.length === 0) {
      throw new Error("Prospect not found");
    }

    const rows = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.leadId, prospectId)
      ))
      .orderBy(asc(tasks.dueAt));

    return rows.map(taskFromRow);
  });
}

export async function createCrmTask(
  prospectId: string,
  input: { title: string; dueAt: string },
): Promise<{ success: boolean; id?: string }> {
  return withTenant(async (db, tenantId) => {
    // Verify prospect
    const prospect = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, prospectId)
      ))
      .limit(1);

    if (prospect.length === 0) {
      throw new Error("Prospect not found");
    }

    const title = input.title?.trim();
    if (!title) return { success: false };

    const now = new Date().toISOString();
    const taskId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

    await db.insert(tasks).values({
      id: taskId,
      tenantId,
      leadId: prospectId,
      title,
      dueAt: input.dueAt || now,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id: taskId };
  });
}

export async function updateCrmTask(
  prospectId: string,
  taskId: string,
  fields: Partial<Pick<CrmTask, "title" | "dueAt" | "completed">>,
): Promise<{ success: boolean }> {
  return withTenant(async (db, tenantId) => {
    // Verify prospect
    const prospect = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, prospectId)
      ))
      .limit(1);

    if (prospect.length === 0) {
      throw new Error("Prospect not found");
    }

    // Verify task
    const task = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.id, taskId as any),
        eq(tasks.leadId, prospectId)
      ))
      .limit(1);

    if (task.length === 0) {
      throw new Error("Task not found");
    }

    const payload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (fields.title !== undefined) payload.title = fields.title.trim();
    if (fields.dueAt !== undefined) payload.dueAt = fields.dueAt;
    if (fields.completed !== undefined) payload.completed = fields.completed;

    await db
      .update(tasks)
      .set(payload)
      .where(eq(tasks.id, taskId as any));

    return { success: true };
  });
}

export async function deleteCrmTask(prospectId: string, taskId: string): Promise<{ success: boolean }> {
  return withTenant(async (db, tenantId) => {
    // Verify prospect
    const prospect = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenantId, tenantId),
        eq(leads.prospectId, prospectId)
      ))
      .limit(1);

    if (prospect.length === 0) {
      throw new Error("Prospect not found");
    }

    // Verify task
    const task = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.id, taskId as any),
        eq(tasks.leadId, prospectId)
      ))
      .limit(1);

    if (task.length === 0) {
      throw new Error("Task not found");
    }

    await db
      .delete(tasks)
      .where(eq(tasks.id, taskId as any));

    return { success: true };
  });
}

// Alias for backward compatibility
export const getProspectById = getProspect;

// ============================================
// Activities
// ============================================

export async function getActivities(prospectId: string): Promise<Activity[]> {
  return withTenant(async (db, tenantId) => {
    try {
      const rows = await db
        .select()
        .from(activities)
        .where(and(
          eq(activities.tenantId, tenantId),
          eq(activities.leadId, prospectId)
        ))
        .orderBy(desc(activities.createdAt))
        .limit(50);

      return rows.map((row: any) => ({
        id: row.id,
        agencyId: row.tenantId,
        prospectId: row.leadId,
        type: row.type as ActivityType,
        title: row.title,
        description: row.description || undefined,
        metadata: (row.metadata as Record<string, unknown>) || undefined,
        createdAt: row.createdAt,
      }));
    } catch (err) {
      console.error("getActivities error:", err);
      return [];
    }
  }, () => []);
}

export async function createActivity(
  tenantId: string,
  leadId: string,
  type: string,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await withTenantContext(db, tenantId, async (tx) => {
      const now = new Date().toISOString();
      await tx.insert(activities).values({
        tenantId,
        leadId,
        type,
        title,
        description: description || null,
        metadata: metadata || {},
        createdAt: now,
      });
    });
  } catch (err) {
    console.error("createActivity error:", err);
  }
}

export async function addActivity(
  prospectId: string,
  type: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  await createActivity(tenantId, prospectId, type, title, description, metadata);
}

export async function addNote(prospectId: string, note: string): Promise<void> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;

  if (!note.trim()) return;

  const db = getDb();
  if (!db) return;

  try {
    await withTenantContext(db, tenantId, async (tx) => {
      // Verify ownership
      const prospect = await tx
        .select()
        .from(leads)
        .where(and(
          eq(leads.tenantId, tenantId),
          eq(leads.prospectId, prospectId)
        ))
        .limit(1);

      if (prospect.length === 0) {
        throw new Error("Prospect not found");
      }

      // Add activity
      await addActivity(prospectId, "note_added", "Note added", note);

      // Append to prospect notes field
      const existing = prospect[0].notes || "";
      const now = new Date();
      const newNotes = existing
        ? `${existing}\n[${now.toLocaleDateString()}] ${note}`
        : note;

      await tx
        .update(leads)
        .set({
          notes: newNotes,
          updatedAt: new Date().toISOString(),
        })
        .where(and(
          eq(leads.tenantId, tenantId),
          eq(leads.prospectId, prospectId)
        ));
    });
  } catch (err) {
    console.error("addNote error:", err);
  }
}

// ============================================
// Stripe Actions
// ============================================

export async function createPaymentLinkAction(params: {
  prospectId: string;
  amount: number;
  type: "down_payment" | "completion";
  description: string;
}): Promise<{ url: string | null; error?: string }> {
  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    if (isTestMode()) {
      await addActivity(
        params.prospectId,
        "note_added",
        `Payment link created: $${params.amount.toLocaleString()} (${params.type})`,
        params.description,
        { stripeSessionId: "cs_test_mock_12345" }
      );
      return { url: "https://checkout.stripe.com/c/pay/cs_test_mock_12345" };
    }

    const { createPaymentLink } = await import("@/lib/stripe");
    const result = await createPaymentLink({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      amount: params.amount,
      type: params.type,
      description: params.description,
    });

    await addActivity(
      params.prospectId,
      "note_added",
      `Payment link created: $${params.amount.toLocaleString()} (${params.type})`,
      params.description,
      { stripeSessionId: result.sessionId }
    );
    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create payment link";
    return { url: null, error: msg };
  }
}

export async function createSubscriptionAction(params: {
  prospectId: string;
  stripePriceId: string;
}): Promise<{ url: string | null; error?: string }> {
  await verifyAuth();

  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    const { createSubscription } = await import("@/lib/stripe");
    const result = await createSubscription({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      stripePriceId: params.stripePriceId,
    });

    // Update prospect with Stripe customer ID
    if (result.customerId) {
      await updateProspect(params.prospectId, {
        stripeCustomerId: result.customerId,
      });
    }

    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create subscription";
    return { url: null, error: msg };
  }
}

export async function getInvoices(prospectId?: string): Promise<any[]> {
  return withTenant(async (db, tenantId) => {
    try {
      // Placeholder — invoices table not yet implemented
      return [];
    } catch (err) {
      console.error("getInvoices error:", err);
      return [];
    }
  }, () => []);
}

// ============================================
// Google Workspace Actions
// ============================================

export async function generateContractAction(params: {
  prospectId: string;
  downPayment: number;
  completionPayment: number;
  monthlyRetainer: number;
  retainerTierName: string;
  crmTierName: string;
}): Promise<{ docUrl: string | null; error?: string }> {
  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { docUrl: null, error: "Prospect not found" };

    if (isTestMode()) {
      await updateProspect(params.prospectId, {
        contractDocUrl: "https://docs.google.com/test-sandbox-doc",
        status: "proposal",
      });
      return { docUrl: "https://docs.google.com/test-sandbox-doc" };
    }

    const { generateContract } = await import("@/lib/google-workspace");
    const result = await generateContract({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
      clientPhone: prospect.phone,
      downPayment: params.downPayment,
      completionPayment: params.completionPayment,
      monthlyRetainer: params.monthlyRetainer,
      retainerTierName: params.retainerTierName,
      crmTierName: params.crmTierName,
    });

    await updateProspect(params.prospectId, {
      contractDocUrl: result.docUrl,
      status: prospect.status === "lead" || prospect.status === "contacted" ? "proposal" : prospect.status,
    });

    await addActivity(
      params.prospectId,
      "contract_sent",
      "Contract generated and shared",
      `MSA sent to ${prospect.email} for e-signature`,
      { docId: result.docId, docUrl: result.docUrl }
    );

    return { docUrl: result.docUrl };
  } catch (err: unknown) {
    console.error("[Contract Generation Error]", err);
    return { docUrl: null, error: err instanceof Error ? err.message : "Failed to generate contract" };
  }
}

export async function createClientFolderAction(
  prospectId: string
): Promise<{ folderUrl: string | null; error?: string }> {
  try {
    const prospect = await getProspect(prospectId);
    if (!prospect) return { folderUrl: null, error: "Prospect not found" };

    const { createClientFolder } = await import("@/lib/google-workspace");
    const result = await createClientFolder({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
    });

    await updateProspect(prospectId, {
      driveFolderUrl: result.folderUrl,
    });

    await addActivity(
      prospectId,
      "note_added",
      "Google Drive folder created",
      `Client folder with Assets/Contracts/Deliverables subfolders. Assets folder shared with ${prospect.email}`,
      { folderId: result.folderId, folderUrl: result.folderUrl }
    );

    return { folderUrl: result.folderUrl };
  } catch (err: unknown) {
    return { folderUrl: null, error: err instanceof Error ? err.message : "Failed to create Drive folder" };
  }
}

// ============================================
// Search
// ============================================

export async function searchOmni(query: string): Promise<{
  id: string;
  name: string;
  email: string;
  company: string;
}[]> {
  return withTenant(async (db, tenantId) => {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();

    try {
      const rows = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, tenantId))
        .limit(100);

      const results = rows
        .map((row: LeadRow) => ({
          id: row.prospectId,
          name: row.name || "",
          email: row.email || "",
          company: row.company || "",
        }))
        .filter((p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.company || "").toLowerCase().includes(q)
        )
        .slice(0, 10);

      return results;
    } catch (err) {
      console.error("Omnisearch error:", err);
      return [];
    }
  }, () => []);
}

// ============================================
// Recent Activities (Notification Feed)
// ============================================

export async function getRecentActivities(limit = 10) {
  return withTenant(async (db, tenantId) => {
    try {
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.tenantId, tenantId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);

      return rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        description: row.title,
        prospectId: row.leadId,
        createdAt: row.createdAt,
      }));
    } catch (err) {
      console.error("getRecentActivities error:", err);
      return [];
    }
  }, () => []);
}

export async function saveQuoteAction(prospectId: string, data: any) {
  return { ok: true, quoteId: "stub-quote-id" };
}
