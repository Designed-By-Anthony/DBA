import { NextRequest, NextResponse } from "next/server";
import type { PublicLeadMarketingMeta } from "@dba/lead-form-contract";
import { leadWebhookCorsHeaders } from "@/lib/lead-webhook-cors";
import { executeLeadIntake } from "@/lib/execute-lead-intake";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { readBoundedJson } from "@/lib/body-limit";

const LEAD_INGEST_MAX_BYTES = 8 * 1024;

function pickStr(body: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = body[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function buildMarketingMeta(body: Record<string, unknown>): PublicLeadMarketingMeta | undefined {
  const meta: PublicLeadMarketingMeta = {
    ctaSource: pickStr(body, "ctaSource", "cta_source") || undefined,
    pageContext: pickStr(body, "pageContext", "page_context") || undefined,
    offerType: pickStr(body, "offerType", "offer_type") || undefined,
    leadSource: pickStr(body, "leadSource", "lead_source") || undefined,
    pageUrl: pickStr(body, "pageUrl", "page_url") || undefined,
    referrerUrl: pickStr(body, "referrerUrl", "referrer_url") || undefined,
    pageTitle: pickStr(body, "pageTitle", "page_title") || undefined,
    sourcePage: pickStr(body, "sourcePage", "source_page") || undefined,
    gaClientId: pickStr(body, "gaClientId", "ga_client_id") || undefined,
  };
  const hasAny = Object.values(meta).some((v) => v != null && v !== "");
  return hasAny ? meta : undefined;
}

/**
 * Public lead ingest (no shared secret in the browser).
 * Server applies `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` / tenant resolution.
 *
 * Marketing site + personal Lighthouse app: POST JSON here from the browser.
 * Honeypot: leave `_hp` empty (hidden field); bots that fill it are ignored.
 *
 * When `TURNSTILE_SECRET_KEY` is set, `cfTurnstileResponse` (or `cf-turnstile-response`) is verified.
 *
 * Set `PUBLIC_LEAD_INGEST_DISABLED=true` to turn this route off.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const headers = leadWebhookCorsHeaders(request);
  return NextResponse.json(
    {
      ok: true,
      endpoint: "public-lead-ingest",
      post: "POST JSON: name|first_name, email, optional phone, company, website, message|biggest_issue, source, auditUrl, marketing attribution fields, _hp (empty), cfTurnstileResponse",
      honeypot: "Include _hp as empty string (hidden field) to reduce spam bots.",
    },
    { headers },
  );
}

export async function POST(request: NextRequest) {
  const cors = leadWebhookCorsHeaders(request);

  if (process.env.PUBLIC_LEAD_INGEST_DISABLED === "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: cors });
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
    const isProd = process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && process.env.VERCEL === "1");
    const bypassOk = process.env.PUBLIC_LEAD_INGEST_ALLOW_NO_TURNSTILE === "true";
    if (isProd && !bypassOk) {
      console.error("[public-lead] rejected: TURNSTILE_SECRET_KEY not configured in production");
      return NextResponse.json(
        { error: "Bot verification not configured" },
        { status: 503, headers: cors },
      );
    }
  }

  try {
    const parsed = await readBoundedJson<Record<string, unknown>>(request, LEAD_INGEST_MAX_BYTES);
    if (!parsed.ok) {
      const status = parsed.reason === "too_large" ? 413 : 400;
      return NextResponse.json({ error: "Invalid request" }, { status, headers: cors });
    }
    const body = parsed.value;

    // Honeypot — must be absent or empty
    if (body._hp != null && String(body._hp).trim() !== "") {
      return NextResponse.json({ success: true }, { headers: cors });
    }

    const name =
      pickStr(body, "name", "first_name", "firstName") ||
      pickStr(body, "full_name");
    const email = pickStr(body, "email");
    const phone = pickStr(body, "phone");
    const company = pickStr(body, "company");
    const website = pickStr(body, "website", "websiteUrl");
    const source = pickStr(body, "source") || "contact_form";
    const message = pickStr(body, "message", "biggest_issue", "projectRequirements");
    const auditUrl = pickStr(body, "auditUrl", "auditReportUrl");
    // Deliberately IGNORE body.agencyId for the public endpoint. The browser
    // must not be able to direct a lead into a tenant it doesn't own — that
    // was a cross-tenant lead-stuffing path. All public submissions route
    // through the server-resolved LEAD_WEBHOOK_DEFAULT_AGENCY_ID in
    // executeLeadIntake(). The authenticated /api/webhooks/lead endpoint
    // still accepts an explicit agencyId.
    const marketing = buildMarketingMeta(body);

    const turnstileToken = pickStr(
      body,
      "cfTurnstileResponse",
      "cf-turnstile-response",
      "turnstileToken",
    );
    if (turnstileEnforced) {
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded?.split(",")[0]?.trim() || undefined;
      const tv = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!tv.success) {
        return NextResponse.json(
          { error: "Bot verification failed. Please refresh and try again." },
          { status: 403, headers: cors },
        );
      }
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400, headers: cors },
      );
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
      // agencyId intentionally omitted — see comment above.
      marketing,
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
    console.error("Public lead ingest error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    const status = msg === "Name and email are required" ? 400 : 500;
    return NextResponse.json({ error: msg }, { status, headers: cors });
  }
}
