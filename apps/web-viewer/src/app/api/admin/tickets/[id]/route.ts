import { NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";
import { sendMail } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import { escapeHtml } from "@/lib/email-utils";
import { apiError } from "@/lib/api-error";
import { sendWebPushToProspect } from "@/lib/push-notify";

/**
 * PATCH /api/admin/tickets/[id]
 * Body: { adminReply: string, status: string }
 * Updates a tenant-scoped SQL ticket, then notifies the client by email.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { id: ticketId } = await params;
    const { adminReply, status } = (await request.json()) as { adminReply?: string; status?: "open" | "in_progress" | "resolved" | "closed" };

    const currentRows = await database
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, ticketId),
          // tenant scoping is mandatory for admin reads
          eq(tickets.tenantId, orgId),
        ),
      )
      .limit(1);

    const ticket = currentRows[0];
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const existingMessages = (ticket.messages || []) as Array<{ from?: string }>;
    const hadAdminMessage = existingMessages.some((m) => m.from === "admin");
    const hasReply = Boolean(adminReply?.trim());
    const isFirstAdminReply = hasReply && !hadAdminMessage;

    const newMessage = hasReply
      ? {
          id: `msg_${Date.now()}`,
          from: "admin" as const,
          content: adminReply!.trim(),
          createdAt: new Date().toISOString(),
        }
      : null;

    const nextMessages = newMessage ? [...(ticket.messages || []), newMessage] : ticket.messages;
    const nextStatus = status || ticket.status;
    const nowIso = new Date().toISOString();

    await database
      .update(tickets)
      .set({
        adminReply: adminReply ?? ticket.adminReply,
        status: nextStatus,
        messages: nextMessages,
        updatedAt: nowIso,
        resolvedAt: nextStatus === "resolved" || nextStatus === "closed" ? nowIso : null,
        firstResponseAt: isFirstAdminReply && !ticket.firstResponseAt ? nowIso : ticket.firstResponseAt,
      })
      .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, orgId)));

    if (ticket.leadEmail && hasReply) {
      const safeFirstName = escapeHtml(
        (ticket.leadName || "there").split(" ")[0],
      );
      const safeTicketSubject = escapeHtml(ticket.subject);
      const safeReply = escapeHtml(adminReply?.trim() || "");
      const safeStatus = escapeHtml(String(nextStatus).replace("_", " "));
      const safeAddress = complianceConfig.physicalAddress
        .replace(/\\n/g, ", ");
      try {
        await sendMail({
          from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
          to: [ticket.leadEmail],
          // Subject is plain text; strip CRLF to prevent header injection.
          subject: `Re: ${String(ticket.subject).replace(/[\r\n]+/g, ' ')}`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hi ${safeFirstName},</p>
              <p style="margin: 0 0 16px; color: #aaa;">We've replied to your support ticket:</p>
              <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 0 0 16px; border-left: 3px solid #2563eb;">
                <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Your ticket: ${safeTicketSubject}</p>
                <p style="color: #fff; margin: 0; white-space: pre-wrap;">${safeReply}</p>
              </div>
              <p style="color: #888; font-size: 13px; margin: 0 0 24px;">
                Status: <strong style="color: #fff;">${safeStatus}</strong>
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "[REDACTED]"}/portal/dashboard"
                style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                View in Your Portal →
              </a>
              <p style="color: #555; font-size: 12px; margin: 24px 0 0;">Designed by Anthony · ${escapeHtml(safeAddress)}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Client reply notification failed:", e);
      }
    }

    // Push notification to client portal
    if (ticket.leadId && hasReply) {
      sendWebPushToProspect(ticket.leadId, {
        title: `Ticket Update: ${ticket.subject}`,
        body: adminReply!.trim().slice(0, 120),
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://admin.vertaflow.io"}/portal/tickets`,
      }).catch((e: unknown) => console.error("Push to prospect failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return apiError("admin/tickets/[id]", error);
  }
}
