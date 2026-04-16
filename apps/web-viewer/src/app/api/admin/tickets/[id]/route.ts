import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";
import { Resend } from "resend";
import { complianceConfig } from "@/lib/theme.config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    const { adminReply, status } = (await request.json()) as { adminReply?: string; status?: string };

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

    if (ticket.prospectEmail && resend && hasReply) {
      try {
        await resend.emails.send({
          from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
          to: [ticket.prospectEmail],
          subject: `Re: ${ticket.subject}`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hi ${(ticket.prospectName || "there").split(" ")[0]},</p>
              <p style="margin: 0 0 16px; color: #aaa;">We've replied to your support ticket:</p>
              <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 0 0 16px; border-left: 3px solid #2563eb;">
                <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Your ticket: ${ticket.subject}</p>
                <p style="color: #fff; margin: 0;">${adminReply?.trim() || ""}</p>
              </div>
              <p style="color: #888; font-size: 13px; margin: 0 0 24px;">
                Status: <strong style="color: #fff;">${String(nextStatus).replace("_", " ")}</strong>
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "[REDACTED]"}/portal/dashboard"
                style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                View in Your Portal →
              </a>
              <p style="color: #555; font-size: 12px; margin: 24px 0 0;">Designed by Anthony · ${complianceConfig.physicalAddress.replace(/\\n/g, ", ")}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Client reply notification failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
