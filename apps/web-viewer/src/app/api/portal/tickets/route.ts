import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";
import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import { getPortalSessionFromRequest } from "@/lib/portal-auth";
import { escapeHtml } from "@/lib/email-utils";
import { apiError } from "@/lib/api-error";
import { readBoundedJson } from "@/lib/body-limit";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const TICKET_MAX_BYTES = 32 * 1024;

/**
 * GET /api/portal/tickets
 * Returns all tickets for the authenticated client.
 */
export async function GET(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const rows = await database
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, session.tenantId),
          eq(tickets.prospectId, session.prospectId),
        ),
      )
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json({
      tickets: rows.map((row) => ({
        id: row.id,
        subject: row.subject,
        description: row.description,
        status: row.status,
        priority: row.priority,
        messages: row.messages,
        adminReply: row.adminReply || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Ticket list error:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

/**
 * POST /api/portal/tickets
 * Body: { subject: string, description?: string }
 * Creates a support ticket and notifies the admin.
 */
export async function POST(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Per-session burst protection. A compromised client (stolen session cookie)
  // shouldn't be able to flood the admin inbox with ticket-creation emails.
  const retry = rateLimit(
    `portal-tickets:${session.tenantId}:${session.prospectId}`,
    10,
    60_000,
  );
  if (retry !== null) {
    return tooManyRequests(retry);
  }

  try {
    const parsed = await readBoundedJson<{ subject?: string; description?: string }>(
      request,
      TICKET_MAX_BYTES,
    );
    if (!parsed.ok) {
      const status = parsed.reason === "too_large" ? 413 : 400;
      return NextResponse.json({ error: "Invalid request" }, { status });
    }
    const { subject, description } = parsed.value;

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const createdAt = new Date().toISOString();
    const message = {
      id: `msg_${Date.now()}`,
      from: "client" as const,
      content: description?.trim() || subject.trim(),
      createdAt,
    };

    const inserted = await database
      .insert(tickets)
      .values({
        tenantId: session.tenantId,
        prospectId: session.prospectId,
        prospectEmail: session.prospectEmail,
        prospectName: session.prospectName,
        subject: subject.trim(),
        description: description?.trim() || "",
        status: "open",
        priority: "medium",
        messages: [message],
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: tickets.id });

    // Notify admin via email (best-effort).
    try {
      const safeName = escapeHtml(session.prospectName);
      const safeEmail = escapeHtml(session.prospectEmail);
      const safeSubject = escapeHtml(subject.trim());
      const safeDescription = description ? escapeHtml(description.trim()) : '';
      await sendMail({
        from: `Agency OS <${complianceConfig.fromEmail}>`,
        to: [complianceConfig.adminNotificationEmail],
        // Subject is a plain-text header, so there's no HTML injection here,
        // but a CRLF in `subject.trim()` could still split headers — keep a
        // conservative strip.
        subject: `🎫 Support Ticket: ${subject.trim().replace(/[\r\n]+/g, ' ')} — ${session.prospectName}`,
        html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <h2 style="color: #fff; margin: 0 0 16px;">🎫 New Support Ticket</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888;">Client</td><td style="color: #fff;">${safeName}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="color: #fff;">${safeEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="color: #fff;">${safeSubject}</td></tr>
                ${safeDescription ? `<tr><td style="padding: 8px 0; color: #888;">Details</td><td style="color: #fff;">${safeDescription}</td></tr>` : ''}
              </table>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "[REDACTED]"}/admin/tickets"
                style="display: inline-block; margin-top: 20px; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
                View in Agency OS →
              </a>
            </div>
          `,
      });
    } catch (e) {
      console.error("Ticket notification email failed:", e);
    }

    return NextResponse.json({ success: true, ticketId: inserted[0]?.id });
  } catch (error: unknown) {
    return apiError("portal/tickets", error);
  }
}
