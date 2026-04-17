/**
 * `POST /api/v1/ingest` — the versioned Augusta ingest alias.
 *
 * Same behavior as `POST /api/leads/ingest`: Zod-validates via
 * `@dba/lead-form-contract`, authenticates via `X-DBA-SECRET` (or the
 * legacy `x-webhook-secret` path, or a Turnstile token), resolves the
 * tenant via `X-Tenant-Id` / `X-Agency-Id`, writes to the Postgres
 * `leads` table, and fires the `lead_created` automation.
 *
 * Kept as a separate route so external integrations (the marketing
 * Astro site, partner webhooks, Zapier) can point at a stable
 * versioned URL while we iterate on the canonical route path.
 */
import { NextRequest, NextResponse } from "next/server";
import { handleIngestPost, ingestManifest } from "@/lib/lead-intake/ingest-handler";
import { leadWebhookCorsHeaders } from "@/lib/lead-webhook-cors";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  return NextResponse.json(ingestManifest("v1-ingest"), {
    headers: leadWebhookCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  return handleIngestPost(request);
}
