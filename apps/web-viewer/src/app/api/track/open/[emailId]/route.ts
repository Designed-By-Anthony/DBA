import { type NextRequest, NextResponse } from "next/server";
import { getDb, emails } from "@dba/database";
import { eq, sql } from "drizzle-orm";

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

  // Increment open count
  try {
    const db = getDb();
    if (db) {
      await db
        .update(emails)
        .set({ opens: sql`COALESCE(${emails.opens}, 0) + 1` })
        .where(eq(emails.id, emailId));
    }
  } catch (err) {
    console.error("Open tracking error:", err);
  }

  // Return transparent 1x1 GIF
  return new NextResponse(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
