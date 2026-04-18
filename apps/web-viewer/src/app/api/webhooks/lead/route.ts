import { NextRequest, NextResponse } from 'next/server';
import { webhookConfig } from '@/lib/theme.config';
import { resolveLeadAgencyId } from '@/lib/lead-webhook-agency';
import { leadWebhookCorsHeaders } from '@/lib/lead-webhook-cors';
import { executeLeadIntake } from '@/lib/execute-lead-intake';
import { timingSafeEqualStr } from '@/lib/webhook-auth';
import { apiError } from '@/lib/api-error';
import { readBoundedJson } from '@/lib/body-limit';

const LEAD_WEBHOOK_MAX_BYTES = 16 * 1024;

/**
 * Authenticated lead webhook (secret in body or headers).
 * For **browser forms without a secret**, use `POST /api/lead` instead.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const provided =
    request.headers.get('x-webhook-secret') ||
    request.headers.get('x-lead-secret') ||
    '';
  const expected = webhookConfig.leadWebhookSecret || '';
  const secretOk = expected.length > 0 && timingSafeEqualStr(provided, expected);
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

type LeadWebhookBody = {
  secret?: unknown;
  ping?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  website?: unknown;
  websiteUrl?: unknown;
  source?: unknown;
  message?: unknown;
  projectRequirements?: unknown;
  auditUrl?: unknown;
  auditReportUrl?: unknown;
  agencyId?: unknown;
};

export async function POST(request: NextRequest) {
  const cors = leadWebhookCorsHeaders(request);
  try {
    const parsed = await readBoundedJson<LeadWebhookBody>(request, LEAD_WEBHOOK_MAX_BYTES);
    if (!parsed.ok) {
      const status = parsed.reason === 'too_large' ? 413 : 400;
      return NextResponse.json({ error: 'Invalid request' }, { status, headers: cors });
    }
    const body = parsed.value;

    const provided = String(
      body.secret ||
        request.headers.get('x-webhook-secret') ||
        request.headers.get('x-lead-secret') ||
        '',
    );
    const expected = webhookConfig.leadWebhookSecret || '';
    if (expected.length === 0 || !timingSafeEqualStr(provided, expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    if (body.ping === true || body.ping === 'true') {
      const agencyId = await resolveLeadAgencyId(
        typeof body.agencyId === 'string' ? body.agencyId : undefined,
      );
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
    // Preserve the validation message to the client; everything else goes
    // through the generic hygiene helper so implementation detail stays in logs.
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Name and email are required') {
      return NextResponse.json({ error: msg }, { status: 400, headers: cors });
    }
    return apiError('webhooks/lead', error, { headers: cors });
  }
}
