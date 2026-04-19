import { NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";
import { z } from "zod";
import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import { escapeHtml } from "@/lib/email-utils";
import { sendWebPushToProspect } from "@/lib/push-notify";

/**
 * GET /api/admin/tickets
 * Returns all tickets across all clients (admin only, dev bypass active)
 */
export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const rows = await database
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, orgId))
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        leadId: row.leadId,
        leadName: row.leadName,
        leadEmail: row.leadEmail,
        subject: row.subject,
        description: row.description,
        status: row.status,
        priority: row.priority,
        adminReply: row.adminReply,
        messages: row.messages,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        resolvedAt: row.resolvedAt,
        firstResponseAt: row.firstResponseAt,
        // Map legacy field names for the UI
        prospectId: row.leadId,
        prospectName: row.leadName,
      })),
    );
  } catch (err) {
    console.error("Admin ticket list error:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

const createTicketSchema = z.object({
  leadId: z.string().min(1),
  leadName: z.string().min(1),
  leadEmail: z.string().email(),
  subject: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

/**
 * POST /api/admin/tickets
 * Admin creates a ticket on behalf of a client and notifies them via email + push.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { leadId, leadName, leadEmail, subject, description, priority } = parsed.data;
    const nowIso = new Date().toISOString();
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const initialMessage = {
      id: `msg_${Date.now()}`,
      from: "admin" as const,
      content: description,
      createdAt: nowIso,
    };

    await database.insert(tickets).values({
      id: ticketId,
      tenantId: orgId,
      leadId,
      leadName,
      leadEmail,
      subject,
      description,
      status: "open",
      priority,
      messages: [initialMessage],
      createdAt: nowIso,
      updatedAt: nowIso,
      firstResponseAt: nowIso, // Admin created it, so first response is immediate
    });

    // Notify client via email
    const safeFirstName = escapeHtml((leadName || "there").split(" ")[0]);
    const safeSubject = escapeHtml(subject);
    const safeDescription = escapeHtml(description);
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://admin.designedbyanthony.com"}/portal/tickets`;

    try {
      await sendMail({
        from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
        to: [leadEmail],
        subject: `New Support Ticket: ${String(subject).replace(/[\r\n]+/g, " ")}`,
        html: `
          <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
            <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hi ${safeFirstName},</p>
            <p style="margin: 0 0 16px; color: #aaa;">A support ticket has been created for you:</p>
            <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 0 0 16px; border-left: 3px solid #2563eb;">
              <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Subject: ${safeSubject}</p>
              <p style="color: #fff; margin: 0; white-space: pre-wrap;">${safeDescription}</p>
            </div>
            <a href="${portalUrl}"
              style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              View in Your Portal →
            </a>
            <p style="color: #555; font-size: 12px; margin: 24px 0 0;">Designed by Anthony · ${escapeHtml(complianceConfig.physicalAddress.replace(/\\n/g, ", "))}</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Ticket creation email failed:", e);
    }

    // Push notification to client
    sendWebPushToProspect(leadId, {
      title: "New Support Ticket",
      body: `Re: ${subject}`,
      url: portalUrl,
    }).catch((e: unknown) => console.error("Push to prospect failed:", e));

    return NextResponse.json({ success: true, ticketId });
  } catch (err) {
    console.error("Admin ticket create error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
