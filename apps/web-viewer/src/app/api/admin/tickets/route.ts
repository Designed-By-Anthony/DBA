import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

/**
 * GET /api/admin/tickets
 * Returns all tickets across all clients (admin only, dev bypass active)
 */
export async function GET() {
  try {
    const q = await db.collection('tickets').orderBy('createdAt', 'desc').get();
    const tickets = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(tickets);
  } catch (err) {
    console.error('Admin ticket list error:', err);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}
