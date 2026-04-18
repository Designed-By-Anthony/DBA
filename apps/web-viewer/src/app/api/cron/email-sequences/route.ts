import { NextRequest, NextResponse } from "next/server";
import { processEmailSequences } from "@/lib/email-sequence-processor";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/email-sequences
 *
 * Schedule from Vercel Cron (or equivalent) with:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * The previous implementation also accepted `?secret=<value>` on the
 * query string. That was removed because query parameters end up in
 * CDN access logs, Vercel function logs, browser history, referrers,
 * and crash reports — all of which are unsafe homes for a shared secret.
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const result = await processEmailSequences();
  return NextResponse.json({ ok: true, ...result });
}
