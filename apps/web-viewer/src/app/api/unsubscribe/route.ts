import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email-utils";
import { getDb, leads } from "@dba/database";
import { eq } from "drizzle-orm";

// GET /api/unsubscribe?id=prospect-id&token=verification-token
// CAN-SPAM compliant: one-click, no login required
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const token = request.nextUrl.searchParams.get("token");

  if (!id || !token) {
    return new NextResponse(renderPage("Invalid Link", "This unsubscribe link is invalid or has expired."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const isValid = verifyUnsubscribeToken(id, token);
    if (!isValid) {
      return new NextResponse(renderPage("Invalid Link", "This unsubscribe link is invalid."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }
  } catch {
    return new NextResponse(renderPage("Invalid Link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Set unsubscribed flag in SQL
  try {
    const db = getDb();
    if (db) {
      await db
        .update(leads)
        .set({ unsubscribed: true, updatedAt: new Date().toISOString() })
        .where(eq(leads.prospectId, id));
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
  }

  return new NextResponse(
    renderPage(
      "You've Been Unsubscribed",
      "You will no longer receive marketing emails from Designed by Anthony. If this was a mistake, please contact us at anthony@designedbyanthony.com."
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Designed by Anthony</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0c12;
      color: #f7f4ee;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .card {
      max-width: 480px;
      padding: 48px;
      text-align: center;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      backdrop-filter: blur(12px);
    }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { color: #9ca3ae; line-height: 1.7; font-size: 15px; }
    a { color: #6366f1; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
