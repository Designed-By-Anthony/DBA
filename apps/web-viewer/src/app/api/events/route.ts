import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { WebhookEventPayload } from 'resend';
import { isTestMode } from '@/lib/test-mode';

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || '';

/**
 * Resend webhook endpoint (Svix-signed).
 *
 * Dashboard: Webhooks → endpoint URL `https://<your-domain>/api/events`,
 * events include `email.received`. Paste the signing secret into `RESEND_WEBHOOK_SECRET`.
 *
 * @see https://resend.com/docs/dashboard/webhooks/introduction
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  let event: WebhookEventPayload;

  if (isTestMode()) {
    try {
      event = JSON.parse(body) as WebhookEventPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  } else {
    if (!webhookSecret) {
      console.error('[resend events] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const svixId = request.headers.get('svix-id');
    const svixTs = request.headers.get('svix-timestamp');
    const svixSig = request.headers.get('svix-signature');
    if (!svixId || !svixTs || !svixSig) {
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
    }

    try {
      const resend = new Resend();
      event = resend.webhooks.verify({
        webhookSecret,
        payload: body,
        headers: {
          id: svixId,
          timestamp: svixTs,
          signature: svixSig,
        },
      });
    } catch (err) {
      console.error('[resend events] signature verification failed', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  if (event.type === 'email.received') {
    const apiKey = process.env.RESEND_API_KEY;
    const fetchFull =
      process.env.RESEND_INBOUND_FETCH_BODY === 'true' && Boolean(apiKey);
    if (fetchFull) {
      try {
        const client = new Resend(apiKey);
        const full = await client.emails.receiving.get(event.data.email_id);
        if (full.error) {
          console.warn('[resend events] receiving.get failed', full.error);
        }
      } catch (e) {
        console.warn('[resend events] receiving.get threw', e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
