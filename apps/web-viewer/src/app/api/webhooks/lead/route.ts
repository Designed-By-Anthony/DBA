import { NextRequest, NextResponse } from 'next/server';
import { webhookConfig } from '@/lib/theme.config';
import { resolveLeadAgencyId } from '@/lib/lead-webhook-agency';
import { leadWebhookCorsHeaders } from '@/lib/lead-webhook-cors';
import { executeLeadIntake } from '@/lib/execute-lead-intake';

/**
 * Authenticated lead webhook (secret in body or headers).
 * For **browser forms without a secret**, use `POST /api/lead` instead.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('x-webhook-secret') ||
    request.headers.get('x-lead-secret');
  const secretOk = secret === webhookConfig.leadWebhookSecret;
  let resolvedAgencyId: string | undefined;
  if (secretOk) {
    resolvedAgencyId = await resolveLeadAgencyId();
  }
  const headers = leadWebhookCorsHeaders(request);
  return NextResponse.json(
    {
      status: 'ok',
      endpoint: 'lead-webhook',
      secretOk,
      ...(secretOk
        ? {
            resolvedAgencyId,
            hint:
              resolvedAgencyId && resolvedAgencyId.length > 0
                ? 'This agency id is used for new prospects when the form does not send agencyId.'
                : 'Set LEAD_WEBHOOK_DEFAULT_AGENCY_ID to your Clerk org id, or pass agencyId in the POST body.',
          }
        : {}),
    },
    { headers },
  );
}

export async function POST(request: NextRequest) {
  const cors = leadWebhookCorsHeaders(request);
  try {
    const body = await request.json();

    const secret =
      body.secret ||
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-lead-secret');
    if (secret !== webhookConfig.leadWebhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    if (body.ping === true || body.ping === 'true') {
      const agencyId = await resolveLeadAgencyId(body.agencyId);
      return NextResponse.json(
        {
          ok: true,
          ping: true,
          resolvedAgencyId: agencyId,
          secretOk: true,
          message: 'Webhook secret and agency resolution OK. No prospect created.',
        },
        { headers: cors },
      );
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = body.phone ? String(body.phone).trim() : '';
    const company = body.company ? String(body.company).trim() : '';
    const website = String(body.website || body.websiteUrl || '').trim();
    const source = String(body.source || 'unknown');
    const message = String(body.message || body.projectRequirements || '').trim();
    const auditUrl = String(body.auditUrl || body.auditReportUrl || '').trim();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400, headers: cors });
    }

    const result = await executeLeadIntake({
      name,
      email,
      phone,
      company,
      website,
      source,
      message,
      auditUrl,
      agencyId: typeof body.agencyId === 'string' ? body.agencyId : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        prospectId: result.prospectId,
        isNew: result.isNew,
        agencyId: result.agencyId,
        message: result.message,
      },
      { headers: cors },
    );
  } catch (error: unknown) {
    console.error('Lead webhook error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    const status = msg === 'Name and email are required' ? 400 : 500;
    return NextResponse.json({ error: msg }, { status, headers: cors });
  }
}
