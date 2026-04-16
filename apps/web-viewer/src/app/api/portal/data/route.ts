import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

/**
 * Portal Data API
 * 
 * GET /api/portal/data
 * 
 * Returns the authenticated client's project data:
 * - Prospect info (status, onboarding, links)
 * - Milestones
 * - Support tickets
 * 
 * Auth: Reads the portal_session cookie set during magic link verification
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('portal_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate session
    let sessionQuery;
    try {
      sessionQuery = await db
        .collection('portal_sessions')
        .where('sessionToken', '==', sessionToken)
        .limit(1)
        .get();
    } catch {
      return NextResponse.json({ error: 'Session validation failed' }, { status: 500 });
    }

    if (!sessionQuery || sessionQuery.empty) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const session = sessionQuery.docs[0].data();

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const prospectId = session.prospectId;

    // Fetch prospect data
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    if (!prospectDoc.exists) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const prospect = prospectDoc.data()!;

    // Fetch support tickets
    let tickets: Array<{ id: string; subject: string; status: string; createdAt: string }> = [];
    try {
      const ticketQuery = await db
        .collection('tickets')
        .where('prospectId', '==', prospectId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      tickets = ticketQuery.docs.map((d) => ({
        id: d.id,
        subject: d.data().subject,
        status: d.data().status,
        createdAt: d.data().createdAt,
      }));
    } catch {
      // Tickets collection might not exist yet
    }

    // Build milestones based on prospect status
    const stages = ['lead', 'contacted', 'proposal', 'dev', 'launched'];
    const stageLabels: Record<string, string> = {
      lead: 'Initial Inquiry',
      contacted: 'Discovery Call',
      proposal: 'Proposal & Contract',
      dev: 'Building Your Website',
      launched: 'Website Live!',
    };
    const currentIdx = stages.indexOf(prospect.status || 'lead');
    const milestones = stages.map((stage, i) => ({
      label: stageLabels[stage] || stage,
      completed: i < currentIdx,
      current: i === currentIdx,
    }));

    return NextResponse.json({
      prospect: {
        name: prospect.name || '',
        company: prospect.company || '',
        status: prospect.status || 'lead',
        onboarding: prospect.onboarding || null,
        driveFolderUrl: prospect.driveFolderUrl || null,
        contractDocUrl: prospect.contractDocUrl || null,
        pricingTier: prospect.pricingTier || null,
        // Client-visible update fields
        projectNotes: prospect.projectNotes || null,
        contractSigned: prospect.contractSigned || false,
        contractStatus: prospect.contractStatus || 'draft',
        stagingUrl: prospect.stagingUrl || null,
      },
      milestones,
      tickets,
    });

  } catch (error: unknown) {
    console.error('Portal data error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
