import { type NextRequest, NextResponse } from "next/server";
import { getDb, emails } from "@dba/database";
import { eq, sql } from "drizzle-orm";
import { verifyClickSignature } from "@/lib/email-utils";

/**
 * GET /api/track/click/[emailId]?url=<destination>&sig=<hex_hmac>
 *
 * Logs the click and redirects to the destination URL — but ONLY if `sig` is
 * valid. Prevents open-redirect abuse on the brand domain.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> },
) {
  const { emailId } = await params;
  const urlParam = request.nextUrl.searchParams.get("url");
  const sig = request.nextUrl.searchParams.get("sig");

  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }
  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const target = decodeURIComponent(urlParam);

  if (!verifyClickSignature(emailId, target, sig)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Only allow http(s) schemes
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Unsupported URL scheme", { status: 400 });
    }
  } catch {
    return new NextResponse("Malformed URL", { status: 400 });
  }

  // Record click in SQL
  try {
    const db = getDb();
    if (db) {
      await db
        .update(emails)
        .set({
          clicks: sql`COALESCE(${emails.clicks}, 0) + 1`,
        })
        .where(eq(emails.id, emailId));
    }
  } catch (err) {
    console.error("Click tracking error:", err);
  }

  return NextResponse.redirect(target);
}
