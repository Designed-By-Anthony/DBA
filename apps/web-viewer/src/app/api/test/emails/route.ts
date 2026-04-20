import { type NextRequest, NextResponse } from "next/server";
import { clearTestOutbox, findTestEmails, getTestOutbox, isEmailTestMode } from "@/lib/mailer";

/**
 * Test-only inspector for the in-memory email outbox.
 *
 * Available ONLY when `isEmailTestMode()` is true — in production this route
 * returns 404 so the outbox never leaks.
 *
 * GET  /api/test/emails?to=<substr>&subject=<substr>  → recent test-fired emails
 * DELETE /api/test/emails                              → clear outbox
 */
function guard(): NextResponse | null {
  if (!isEmailTestMode()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const to = request.nextUrl.searchParams.get("to") || undefined;
  const subject = request.nextUrl.searchParams.get("subject") || undefined;
  const emails = to || subject
    ? findTestEmails({ to, subjectContains: subject })
    : getTestOutbox();

  return NextResponse.json({ count: emails.length, emails });
}

export async function DELETE() {
  const blocked = guard();
  if (blocked) return blocked;

  clearTestOutbox();
  return NextResponse.json({ success: true });
}
