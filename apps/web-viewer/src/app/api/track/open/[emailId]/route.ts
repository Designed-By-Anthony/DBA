import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

// 1x1 transparent GIF
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// GET /api/track/open/[emailId]
// Increments the open count and returns a 1x1 transparent GIF
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params;

  // Increment open count asynchronously
  try {
    const emailRef = db.collection("emails").doc(emailId);
    const doc = await emailRef.get();
    if (doc.exists) {
      const currentOpens = doc.data()?.opens || 0;
      await emailRef.update({ opens: currentOpens + 1 });
    }
  } catch (err) {
    console.error("Open tracking error:", err);
  }

  // Return transparent 1x1 GIF with no-cache headers
  return new NextResponse(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
