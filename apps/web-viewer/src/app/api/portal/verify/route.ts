import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import crypto from 'crypto';

/**
 * Magic Link Token Verification
 * 
 * POST /api/portal/verify
 * Body: { token: string }
 * 
 * Validates the token, marks it as used, and sets a session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find the token in Firestore
    let tokenQuery;
    try {
      tokenQuery = await db
        .collection('portal_tokens')
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();
    } catch {
      return NextResponse.json({ error: 'Token validation failed' }, { status: 500 });
    }

    if (!tokenQuery || tokenQuery.empty) {
      return NextResponse.json({ error: 'Invalid or already-used token' }, { status: 401 });
    }

    const tokenDoc = tokenQuery.docs[0];
    const tokenData = tokenDoc.data();

    // Check expiration
    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This link has expired. Please request a new one.' }, { status: 401 });
    }

    // Mark token as used
    await db.collection('portal_tokens').doc(tokenDoc.id).update({ used: true });

    // Generate a session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in Firestore (agencyId scopes portal data to the correct org)
    await db.collection('portal_sessions').add({
      sessionToken,
      prospectId: tokenData.prospectId,
      agencyId: tokenData.agencyId || '',
      email: tokenData.email,
      expiresAt: sessionExpiry.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      prospectId: tokenData.prospectId,
    });

    response.cookies.set('portal_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Token verification error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
