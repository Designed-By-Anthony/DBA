import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

/**
 * POST /api/portal/push-token
 * Saves the client's FCM push token to their Firestore record.
 * Called by NotificationOptIn after the browser grants permission.
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('portal_session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find session
    const sessionQuery = await db
      .collection('portal_sessions')
      .where('sessionToken', '==', sessionToken)
      .limit(1)
      .get();

    if (sessionQuery.empty) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const session = sessionQuery.docs[0].data();
    const prospectId = session.prospectId as string;

    // Save FCM token to prospect record
    await db.collection('prospects').doc(prospectId).update({
      fcmToken: token,
      notifyByPush: true,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Push token save error:', err);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/push-token
 * Removes the FCM token (client opts out of push notifications)
 */
export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('portal_session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const sessionQuery = await db
      .collection('portal_sessions')
      .where('sessionToken', '==', sessionToken)
      .limit(1)
      .get();

    if (sessionQuery.empty) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { prospectId } = sessionQuery.docs[0].data();

    await db.collection('prospects').doc(prospectId as string).update({
      fcmToken: null,
      notifyByPush: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Push token remove error:', err);
    return NextResponse.json({ error: 'Failed to remove token' }, { status: 500 });
  }
}
