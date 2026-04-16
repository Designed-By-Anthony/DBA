import { NextRequest, NextResponse } from "next/server";
import { processDueSequenceEnrollments } from "@/lib/email-sequence-processor";

/**
 * GET /api/cron/email-sequences
 * Schedule from Vercel Cron, GitHub Actions, or similar with Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const q = request.nextUrl.searchParams.get("secret");
  const ok =
    secret &&
    (auth === `Bearer ${secret}` || q === secret);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueSequenceEnrollments(100);
  return NextResponse.json({ ok: true, ...result });
}
