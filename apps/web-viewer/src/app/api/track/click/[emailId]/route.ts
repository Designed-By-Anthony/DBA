import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

// GET /api/track/click/[emailId]?url=https://...
// Logs the click and redirects to the destination URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params;
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Log the click asynchronously (don't block the redirect)
  try {
    const emailRef = db.collection("emails").doc(emailId);
    const doc = await emailRef.get();
    if (doc.exists) {
      const clicks = doc.data()?.clicks || [];
      clicks.push({
        url: decodeURIComponent(url),
        clickedAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      await emailRef.update({ clicks });
    }
  } catch (err) {
    console.error("Click tracking error:", err);
  }

  // Redirect to destination
  return NextResponse.redirect(decodeURIComponent(url));
}
