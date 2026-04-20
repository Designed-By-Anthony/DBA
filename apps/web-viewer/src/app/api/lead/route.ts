import type { PublicLeadIngestBody, PublicLeadMarketingMeta } from '@dba/lead-form-contract';
import { parsePublicLeadIngestBody } from '@dba/lead-form-contract';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { apiError } from '@/lib/api-error';
import { readBoundedJson } from '@/lib/body-limit';
import { executeLeadIntake } from '@/lib/execute-lead-intake';
import {
  checkLeadRateLimit,
  isLikelyBotSubmission,
  requireTurnstileInProd,
  validatePublicLead,
} from '@/lib/lead-intake/spam-guard';
import { leadWebhookCorsHeaders } from '@/lib/lead-webhook-cors';
import { verifyTurnstileToken } from '@/lib/turnstile';

const LEAD_INGEST_MAX_BYTES = 8 * 1024;

function marketingMetaFromPublicBody(b: PublicLeadIngestBody): PublicLeadMarketingMeta | undefined {
  const meta: PublicLeadMarketingMeta = {
    ctaSource: b.ctaSource,
    pageContext: b.pageContext,
    offerType: b.offerType,
    leadSource: b.leadSource,
    pageUrl: b.pageUrl,
    referrerUrl: b.referrerUrl,
    pageTitle: b.pageTitle,
    sourcePage: b.sourcePage,
    gaClientId: b.gaClientId,
  };
  const hasAny = Object.values(meta).some((v) => v != null && v !== '');
  return hasAny ? meta : undefined;
}

function resolveClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Public lead ingest (no shared secret in the browser).
 * Server applies `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` / tenant resolution.
 *
 * Marketing site + personal Lighthouse app: POST JSON here from the browser.
 * Honeypot: leave `_hp` empty (hidden field); bots that fill it are ignored.
 *
 * Production bot defenses (in order):
 *   1. Honeypot.
 *   2. Per-IP sliding-window rate limit (default 3 submissions / 60s).
 *   3. Required Turnstile verification when `VERCEL_ENV=production`
 *      (fail-closed: missing `TURNSTILE_SECRET_KEY` => 503, not "accept").
 *   4. Zod parse + disposable-domain validation (`validatePublicLead`).
 *   5. Silent bot heuristics (URL-stuffed names, duplicate email-as-name, …).
 *
 * Set `PUBLIC_LEAD_INGEST_DISABLED=true` to turn this route off, or
 * `PUBLIC_LEAD_DISABLE_TURNSTILE=true` to run prod without Turnstile
 * (NOT recommended — documented for staging).
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const headers = leadWebhookCorsHeaders(request);
  return NextResponse.json(
    {
      ok: true,
      endpoint: 'public-lead-ingest',
      post: 'POST JSON: name|first_name, email, optional phone, company, website, message|biggest_issue, source, auditUrl, marketing attribution fields, _hp (empty), cfTurnstileResponse',
      honeypot: 'Include _hp as empty string (hidden field) to reduce spam bots.',
      turnstileRequired: requireTurnstileInProd(),
    },
    { headers },
  );
}

export async function POST(request: NextRequest) {
  const cors = leadWebhookCorsHeaders(request);

  if (process.env.PUBLIC_LEAD_INGEST_DISABLED === 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
  }

  // Fail closed when Turnstile isn't configured. Previously the Turnstile
  // check was only applied when TURNSTILE_SECRET_KEY was set, so a missing
  // env var silently downgraded the route to "honeypot only" — an attacker
  // who ignores the _hp field would be invisible to us. In production we
  // require Turnstile; preview/dev deployments may opt out with
  // PUBLIC_LEAD_INGEST_ALLOW_NO_TURNSTILE=true.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const turnstileEnforced = Boolean(turnstileSecret);
  if (!turnstileEnforced) {
    const isProd =
      process.env.VERCEL_ENV === 'production' ||
      (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1');
    const bypassOk = process.env.PUBLIC_LEAD_INGEST_ALLOW_NO_TURNSTILE === 'true';
    if (isProd && !bypassOk) {
      return NextResponse.json(
        { error: 'Bot verification not configured' },
        { status: 503, headers: cors },
      );
    }
  }

  try {
    const parsedBody = await readBoundedJson<unknown>(request, LEAD_INGEST_MAX_BYTES);
    if (!parsedBody.ok) {
      const status = parsedBody.reason === 'too_large' ? 413 : 400;
      return NextResponse.json({ error: 'Invalid request' }, { status, headers: cors });
    }

    let body: PublicLeadIngestBody;
    try {
      body = parsePublicLeadIngestBody(parsedBody.value);
    } catch (error) {
      // `@dba/lead-form-contract` may resolve a different `zod` instance than this route file,
      // so `instanceof ZodError` can be false even for validation failures.
      if (
        error instanceof ZodError ||
        (error !== null &&
          typeof error === 'object' &&
          (error as { name?: string }).name === 'ZodError')
      ) {
        return NextResponse.json(
          {
            error: 'Invalid submission data',
            details: error instanceof ZodError ? error.flatten() : undefined,
          },
          { status: 400, headers: cors },
        );
      }
      throw error;
    }

    // 1. Honeypot — must be absent or empty
    if (body._hp != null && String(body._hp).trim() !== '') {
      return NextResponse.json({ success: true }, { headers: cors });
    }

    // 2. Per-IP rate limit — trims opportunistic bot storms
    const clientIp = resolveClientIp(request);
    const rateLimit = checkLeadRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment and try again.' },
        {
          status: 429,
          headers: {
            ...cors,
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    // 3. Required Turnstile in production (fail-closed; key guard handled above)
    if (turnstileEnforced) {
      const tv = await verifyTurnstileToken(body.cfTurnstileResponse ?? '', clientIp);
      if (!tv.success) {
        return NextResponse.json(
          { error: 'Bot verification failed. Please refresh and try again.' },
          { status: 403, headers: cors },
        );
      }
    }

    // 4. Disposable-domain + format checks (user-facing 400s)
    const validationIssue = validatePublicLead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      website: body.website,
      message: body.message,
    });
    if (validationIssue) {
      return NextResponse.json(
        { error: validationIssue.message, errors: [validationIssue] },
        { status: 400, headers: cors },
      );
    }

    // 5. Silent bot heuristics — accept 200 so automated scanners move on,
    //    but never create a prospect or fire an email.
    if (isLikelyBotSubmission(body)) {
      return NextResponse.json({ success: true }, { headers: cors });
    }

    const marketing = marketingMetaFromPublicBody(body);

    const result = await executeLeadIntake({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      website: body.website,
      source: body.source ?? 'contact_form',
      message: body.message,
      auditUrl: body.auditUrl,
      marketing,
      /** When set (Clerk org id present in `tenants`), routes the lead to that tenant instead of the default. */
      agencyId: body.agencyId,
    });

    return NextResponse.json(
      {
        success: true,
        ok: true,
        prospectId: result.prospectId,
        isNew: result.isNew,
        agencyId: result.agencyId,
        message: result.message,
      },
      { headers: cors },
    );
  } catch (error: unknown) {
    return apiError('public-lead-ingest', error, { headers: cors });
  }
}
