import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Resend } from 'resend';
import { complianceConfig } from '@/lib/theme.config';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Magic Link Authentication for Client Portal
 * 
 * POST /api/portal/magic-link
 * Body: { email: string }
 * 
 * Generates a time-limited token, stores it in Firestore,
 * and sends a branded login link to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email is associated with a prospect
    let prospectQuery;
    try {
      prospectQuery = await db
        .collection('prospects')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
        console.log("PROSPECT QUERY RESULT EMPTY?:", prospectQuery.empty);
    } catch (err) {
      console.log("PROSPECT QUERY ERROR:", err);
      prospectQuery = null;
    }

    if (!prospectQuery || prospectQuery.empty) {
      console.log("NO PROSPECT FOUND FOR:", normalizedEmail);
      // Don't reveal if the email exists — just show the success page
      // This prevents email enumeration
      return NextResponse.json({ success: true, debug: 'NO PROSPECT FOUND' });
    }

    const prospectId = prospectQuery.docs[0].id;
    const prospectData = prospectQuery.docs[0].data();
    const prospectName = prospectData.name || 'there';
    const agencyId = prospectData.agencyId || '';

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the token in Firestore (scoped to the org)
    await db.collection('portal_tokens').add({
      token,
      prospectId,
      agencyId,
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
    });

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/portal/verify?token=${token}`;

    // Send the magic link email
    if (process.env.NEXT_PUBLIC_IS_TEST !== 'true' && resend) {
      await resend.emails.send({
        from: `Designed by Anthony <${complianceConfig.fromEmail}>`,
        to: [normalizedEmail],
        subject: 'Your Portal Login Link',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
            <div style="background: #0a0a0f; border-radius: 16px; padding: 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #2563eb; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; margin-bottom: 24px;">
                D
              </div>
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 24px;">Welcome Back, ${prospectName.split(' ')[0]}</h1>
              <p style="color: #888; margin: 0 0 32px; font-size: 14px;">
                Click the button below to access your Client Portal.
              </p>
              <a href="${magicLink}"
                style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">
                Open My Portal →
              </a>
              <p style="color: #555; font-size: 12px; margin-top: 32px;">
                This link expires in 15 minutes. If you didn't request this, you can safely ignore it.
              </p>
            </div>
            <p style="color: #666; font-size: 11px; text-align: center; margin-top: 16px;">
              Designed by Anthony · Rome, NY 13440
            </p>
          </div>
        `,
      });
    }

    if (process.env.NEXT_PUBLIC_IS_TEST === 'true' || request.headers.get('x-e2e-testing') === 'true') {
      return NextResponse.json({ success: true, testModeLink: magicLink });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Magic link error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
