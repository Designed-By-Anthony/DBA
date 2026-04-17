/**
 * Shared handler for the Global Ingest Engine — used by both
 * `/api/leads/ingest` and the versioned alias `/api/v1/ingest`.
 *
 * Auth policy (any ONE of these is sufficient):
 *   1. `X-DBA-SECRET` header matches `INGEST_SECRET` env — the canonical
 *      server-to-server credential for the Augusta rewire.
 *   2. `x-webhook-secret` / `x-lead-secret` header (or body `secret`)
 *      matches `LEAD_WEBHOOK_SECRET` — preserves the pre-existing
 *      integrations that already used the Phase 1 chassis key.
 *   3. `TURNSTILE_SECRET_KEY` is set AND the body carries a valid
 *      `cfTurnstileResponse` — the browser path used by the marketing
 *      Astro forms (no persistent secret required in the browser bundle).
 *
 * Set `LEAD_INGEST_REQUIRE_SECRET=false` to bypass auth entirely for
 * local dev loops (e.g. this cloud-agent VM). Honeypot short-circuit
 * runs BEFORE Zod so bots can't probe for validation errors.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseGlobalLeadIngestBody, constantTimeEqual } from "@dba/lead-form-contract";
import { safeParseVerticalLeadMetadata, type VerticalId } from "@dba/ui";
import { leadWebhookCorsHeaders } from "@/lib/lead-webhook-cors";
import { resolveLeadAgencyId } from "@/lib/lead-webhook-agency";
import { insertSqlLead } from "@/lib/lead-intake/sql";
import { fireAutomationEvent } from "@/lib/automation-runner";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { webhookConfig } from "@/lib/theme.config";

export type IngestEndpointName = "global-lead-ingest" | "v1-ingest";

export function ingestManifest(endpoint: IngestEndpointName) {
  return {
    ok: true,
    endpoint,
    method: "POST",
    auth: {
      primary: "X-DBA-SECRET header (matches INGEST_SECRET env)",
      compat: "x-webhook-secret | x-lead-secret (matches LEAD_WEBHOOK_SECRET)",
      browser: "Cloudflare Turnstile token in `cfTurnstileResponse`",
      tenantHeader: "x-tenant-id | x-agency-id",
    },
    body: {
      email: "required",
      firstName: "optional",
      lastName: "optional",
      name: "optional — synthesized from firstName+lastName if omitted",
      phone: "optional",
      source: "optional (e.g. facebook | qr-code | lighthouse)",
      metadata: "optional; unknown top-level fields are folded in automatically",
      _hp: "honeypot — must be empty",
    },
  } as const;
}

function readIngestSecret(request: NextRequest): string | undefined {
  return request.headers.get("x-dba-secret")?.trim() || undefined;
}

function readLegacySecret(
  request: NextRequest,
  bodySecret: string | undefined,
): string | undefined {
  return (
    request.headers.get("x-webhook-secret")?.trim() ||
    request.headers.get("x-lead-secret")?.trim() ||
    bodySecret?.trim() ||
    undefined
  );
}

function readTenantId(
  request: NextRequest,
  bodyTenantId: string | undefined,
): string | undefined {
  return (
    request.headers.get("x-tenant-id")?.trim() ||
    request.headers.get("x-agency-id")?.trim() ||
    bodyTenantId?.trim() ||
    undefined
  );
}

/**
 * Verifies at least one of: X-DBA-SECRET, legacy webhook secret, or a
 * passing Turnstile token. Returns `null` on success or a populated
 * `NextResponse` (401/403) on failure.
 */
async function verifyAuth(
  request: NextRequest,
  bodySecret: string | undefined,
  turnstileToken: string | undefined,
  cors: Record<string, string>,
): Promise<NextResponse | null> {
  if (process.env.LEAD_INGEST_REQUIRE_SECRET === "false") return null;

  const ingestExpected = process.env.INGEST_SECRET?.trim();
  const ingestProvided = readIngestSecret(request);
  if (ingestExpected && ingestProvided && constantTimeEqual(ingestProvided, ingestExpected)) {
    return null;
  }

  const legacyExpected = webhookConfig.leadWebhookSecret?.trim();
  const legacyProvided = readLegacySecret(request, bodySecret);
  if (legacyExpected && legacyProvided && constantTimeEqual(legacyProvided, legacyExpected)) {
    return null;
  }

  if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || undefined;
    const tv = await verifyTurnstileToken(turnstileToken, clientIp);
    if (tv.success) return null;
    return NextResponse.json(
      { error: "Bot verification failed. Please refresh and try again." },
      { status: 403, headers: cors },
    );
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: cors },
  );
}

export async function handleIngestPost(request: NextRequest): Promise<NextResponse> {
  const cors = leadWebhookCorsHeaders(request);

  if (process.env.PUBLIC_LEAD_INGEST_DISABLED === "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: cors });
  }

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: cors });
  }

  // Honeypot — runs before Zod so bots can't probe validation errors.
  if (
    rawJson &&
    typeof rawJson === "object" &&
    "_hp" in rawJson &&
    typeof (rawJson as Record<string, unknown>)._hp === "string" &&
    ((rawJson as Record<string, unknown>)._hp as string).trim() !== ""
  ) {
    return NextResponse.json({ success: true }, { headers: cors });
  }

  let parsed;
  try {
    parsed = parseGlobalLeadIngestBody(rawJson);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request", issues: err.issues },
        { status: 400, headers: cors },
      );
    }
    throw err;
  }

  const turnstileToken =
    typeof (rawJson as Record<string, unknown>).cfTurnstileResponse === "string"
      ? String((rawJson as Record<string, unknown>).cfTurnstileResponse)
      : typeof (rawJson as Record<string, unknown>)["cf-turnstile-response"] === "string"
        ? String((rawJson as Record<string, unknown>)["cf-turnstile-response"])
        : undefined;

  const authError = await verifyAuth(request, parsed.secret, turnstileToken, cors);
  if (authError) return authError;

  const agencyId = await resolveLeadAgencyId(readTenantId(request, parsed.tenantId));
  if (!agencyId) {
    return NextResponse.json(
      {
        error:
          "Unable to resolve tenant. Set X-Tenant-Id / X-Agency-Id header, pass tenantId in body, or configure LEAD_WEBHOOK_DEFAULT_AGENCY_ID.",
      },
      { status: 400, headers: cors },
    );
  }

  let vertical: VerticalId | undefined;
  try {
    const tenant = await getTenantByOrgId(agencyId);
    vertical = (tenant?.verticalType as VerticalId) || undefined;
  } catch (err) {
    console.error("[ingest] tenant lookup failed", err);
  }

  let cleanMetadata: Record<string, unknown> = parsed.metadata;
  if (vertical) {
    const mres = safeParseVerticalLeadMetadata(vertical, parsed.metadata);
    if (mres.success) {
      cleanMetadata = mres.data as Record<string, unknown>;
    } else {
      console.warn(
        `[ingest] metadata failed vertical=${vertical} Zod; keeping raw JSONB`,
        mres.error.flatten(),
      );
    }
  }

  let sqlResult: { prospectId: string; isNew: boolean } | null = null;
  try {
    sqlResult = await insertSqlLead({
      agencyId,
      name: parsed.core.name,
      firstName: parsed.core.firstName,
      lastName: parsed.core.lastName,
      email: parsed.core.email,
      phone: parsed.core.phone,
      source: parsed.core.source,
      metadata: cleanMetadata,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sql_failed";
    console.error("[ingest] SQL insert failed", err);
    return NextResponse.json(
      { error: `Database temporarily unavailable (${msg})` },
      { status: 503, headers: cors },
    );
  }

  if (!sqlResult) {
    return NextResponse.json(
      {
        error:
          "Database not configured for this deploy. Set DATABASE_URL (and add the runtime IP to Cloud SQL authorized-networks).",
      },
      { status: 503, headers: cors },
    );
  }

  if (sqlResult.isNew) {
    await fireAutomationEvent({
      trigger: "lead_created",
      tenantId: agencyId,
      prospectId: sqlResult.prospectId,
      vertical,
      data: {
        lead: {
          name: parsed.core.name,
          firstName: parsed.core.firstName,
          lastName: parsed.core.lastName,
          email: parsed.core.email,
          phone: parsed.core.phone,
          source: parsed.core.source,
          metadata: cleanMetadata,
        },
      },
    });
  }

  return NextResponse.json(
    {
      success: true,
      ok: true,
      prospectId: sqlResult.prospectId,
      isNew: sqlResult.isNew,
      agencyId,
      vertical: vertical ?? null,
    },
    { headers: cors },
  );
}
