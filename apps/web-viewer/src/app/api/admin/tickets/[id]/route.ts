import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Resend } from 'resend';
import { complianceConfig } from '@/lib/theme.config';
import { sendWebPushToProspect } from '@/lib/push-notify';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * PATCH /api/admin/tickets/[id]
 * Body: { adminReply: string, status: string }
 * Updates a ticket with an admin reply + status, notifies client by email.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { adminReply, status } = await request.json();

    const ticketDoc = await db.collection('tickets').doc(ticketId).get();
    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = ticketDoc.data()!;
    const existingMessages = (ticket.messages || []) as Array<{ from?: string }>;
    const hadAdminMessage = existingMessages.some((m) => m.from === 'admin');
    const isFirstAdminReply = Boolean(adminReply?.trim()) && !hadAdminMessage;

    // Append admin reply to messages thread
    const newMessage = {
      id: `msg_${Date.now()}`,
      from: 'admin',
      content: adminReply,
      createdAt: new Date().toISOString(),
    };

    await db.collection('tickets').doc(ticketId).update({
      adminReply,
      status,
      messages: [...(ticket.messages || []), newMessage],
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
      ...(isFirstAdminReply && !ticket.firstResponseAt
        ? { firstResponseAt: new Date().toISOString() }
        : {}),
    });

    // Log activity on the prospect
    try {
      await db.collection('activities').add({
        prospectId: ticket.prospectId,
        type: 'ticket_replied',
        title: `Support ticket replied: ${ticket.subject}`,
        metadata: { ticketId, status },
        createdAt: new Date().toISOString(),
      });
    } catch { /* non-critical */ }

    // Get client email to send notification
    const prospectDoc = await db.collection('prospects').doc(ticket.prospectId).get();
    const clientEmail = prospectDoc.exists ? prospectDoc.data()?.email : null;
    const clientName = prospectDoc.exists ? prospectDoc.data()?.name?.split(' ')[0] : 'there';

    // Notify client by email
    if (clientEmail && resend) {
      try {
        await resend.emails.send({
          from: `${complianceConfig.fromName} <${complianceConfig.fromEmail}>`,
          to: [clientEmail],
          subject: `Re: ${ticket.subject}`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hi ${clientName},</p>
              <p style="margin: 0 0 16px; color: #aaa;">We've replied to your support ticket:</p>
              <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 0 0 16px; border-left: 3px solid #2563eb;">
                <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Your ticket: ${ticket.subject}</p>
                <p style="color: #fff; margin: 0;">${adminReply}</p>
              </div>
              <p style="color: #888; font-size: 13px; margin: 0 0 24px;">
                Status: <strong style="color: #fff;">${status.replace('_', ' ')}</strong>
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://viewer.designedbyanthony.com'}/portal/dashboard"
                style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                View in Your Portal →
              </a>
              <p style="color: #555; font-size: 12px; margin: 24px 0 0;">Designed by Anthony · ${complianceConfig.physicalAddress.replace(/\\n/g, ', ')}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error('Client reply notification failed:', e);
      }
    }

    try {
      await sendWebPushToProspect(ticket.prospectId as string, {
        title: 'Reply to your ticket',
        body:
          typeof adminReply === 'string' && adminReply.length > 120
            ? `${adminReply.slice(0, 117)}…`
            : String(adminReply || 'New reply'),
        url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/tickets`,
      });
    } catch {
      /* non-critical */
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
