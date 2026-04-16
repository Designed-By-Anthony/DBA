import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Resend } from 'resend';
import { complianceConfig } from '@/lib/theme.config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** Validate session and return { prospectId, email } or null */
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('portal_session')?.value;
  if (!sessionToken) return null;
  try {
    const q = await db.collection('portal_sessions').where('sessionToken', '==', sessionToken).limit(1).get();
    if (q.empty) return null;
    const session = q.docs[0].data();
    if (new Date(session.expiresAt) < new Date()) return null;
    return { prospectId: session.prospectId as string, email: session.email as string };
  } catch {
    return null;
  }
}

/**
 * GET /api/portal/tickets
 * Returns all tickets for the authenticated client.
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const q = await db
      .collection('tickets')
      .where('prospectId', '==', session.prospectId)
      .orderBy('createdAt', 'desc')
      .get();

    const tickets = q.docs.map((d) => ({
      id: d.id,
      subject: d.data().subject as string,
      description: d.data().description as string,
      status: d.data().status as string,
      priority: d.data().priority as string,
      messages: d.data().messages || [],
      adminReply: d.data().adminReply || null,
      createdAt: d.data().createdAt as string,
      updatedAt: d.data().updatedAt || d.data().createdAt,
    }));

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error('Ticket list error:', err);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}

/**
 * POST /api/portal/tickets
 * Body: { subject: string, description?: string }
 * Creates a support ticket and notifies the admin.
 */
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { subject, description } = await request.json();

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const { prospectId } = session;

    // Get prospect name for notifications
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    const prospectName = prospectDoc.exists ? prospectDoc.data()?.name : 'Unknown Client';
    const prospectEmail = prospectDoc.exists ? prospectDoc.data()?.email : session.email;
    const agencyId = prospectDoc.exists ? prospectDoc.data()?.agencyId : undefined;

    // Create ticket
    const ticketRef = await db.collection('tickets').add({
      prospectId,
      ...(agencyId ? { agencyId } : {}),
      prospectName,
      subject: subject.trim(),
      description: description?.trim() || '',
      status: 'open',
      priority: 'medium',
      messages: [{
        id: `msg_${Date.now()}`,
        from: 'client',
        content: description?.trim() || subject.trim(),
        createdAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    });

    // Log activity
    try {
      await db.collection('activities').add({
        prospectId,
        type: 'ticket_created',
        title: `Support ticket: ${subject.trim()}`,
        description: description?.trim() || undefined,
        metadata: { ticketId: ticketRef.id },
        createdAt: new Date().toISOString(),
      });
    } catch { /* don't fail */ }

    // Notify admin via email
    try {
      if (resend) {
        await resend.emails.send({
          from: `Agency OS <${complianceConfig.fromEmail}>`,
          to: [complianceConfig.adminNotificationEmail],
          subject: `🎫 Support Ticket: ${subject.trim()} — ${prospectName}`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <h2 style="color: #fff; margin: 0 0 16px;">🎫 New Support Ticket</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888;">Client</td><td style="color: #fff;">${prospectName}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="color: #fff;">${prospectEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="color: #fff;">${subject.trim()}</td></tr>
                ${description ? `<tr><td style="padding: 8px 0; color: #888;">Details</td><td style="color: #fff;">${description.trim()}</td></tr>` : ''}
              </table>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets"
                style="display: inline-block; margin-top: 20px; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
                View in Agency OS →
              </a>
            </div>
          `,
        });
      }
    } catch (e) {
      console.error('Ticket notification email failed:', e);
    }

    return NextResponse.json({ success: true, ticketId: ticketRef.id });
  } catch (error: unknown) {
    console.error('Ticket creation error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
