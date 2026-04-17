import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { verifyClickSignature } from "@/lib/email-utils";

/**
 * GET /api/track/click/[emailId]?url=<destination>&sig=<hex_hmac>
 *
 * Logs the click and redirects to the destination URL — but ONLY if `sig` is
 * a valid HMAC for (emailId, url) under EMAIL_LINK_SIGNING_SECRET. Without
 * this check the route was an open redirect on the brand domain: an attacker
 * could mail out phishing links like
 *   https://designedbyanthony.com/api/track/click/anything?url=https://attacker.example
 * and the URL would look trustworthy at a glance.
 *
 * Links baked into outbound emails are signed via `wrapLinksForTracking` in
 * src/lib/email-utils.ts. Any link without a valid `sig` is rejected with a
 * 400 and no redirect occurs.
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

  // The signature is computed over the pre-encoded original URL, which is
  // exactly what the browser hands back via searchParams.get (it auto-decodes
  // once). That means we verify against `target`, not `urlParam`.
  if (!verifyClickSignature(emailId, target, sig)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Only allow http(s) schemes. Defensive: the signature alone would already
  // prevent an attacker from inserting a javascript: URL, but we check anyway
  // in case a future signing path forgets to validate.
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Unsupported URL scheme", { status: 400 });
    }
  } catch {
    return new NextResponse("Malformed URL", { status: 400 });
  }

  try {
    const emailRef = db.collection("emails").doc(emailId);
    const doc = await emailRef.get();
    if (doc.exists) {
      const clicks = doc.data()?.clicks || [];
      clicks.push({
        url: target,
        clickedAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      await emailRef.update({ clicks });
    }
  } catch (err) {
    console.error("Click tracking error:", err);
  }

  return NextResponse.redirect(target);
}
