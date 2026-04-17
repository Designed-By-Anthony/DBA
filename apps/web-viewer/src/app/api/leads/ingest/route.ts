/**
 * Augusta Global Ingest Engine — the "Switchboard".
 *
 * `POST /api/leads/ingest` is the canonical path; `POST /api/v1/ingest` is
 * a versioned alias that delegates to the same handler. Both use the
 * shared `handleIngestPost` in `@/lib/lead-intake/ingest-handler`.
 */
import { NextRequest, NextResponse } from "next/server";
import { handleIngestPost, ingestManifest } from "@/lib/lead-intake/ingest-handler";
import { leadWebhookCorsHeaders } from "@/lib/lead-webhook-cors";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: leadWebhookCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  return NextResponse.json(ingestManifest("global-lead-ingest"), {
    headers: leadWebhookCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  return handleIngestPost(request);
}
