import {
	clearGmailTestOutbox,
	getGmailTestOutbox,
	isGmailTestMode,
} from "@lh/lib/gmail";
import { NextResponse } from "next/server";

/**
 * Test-only inspector for the Lighthouse Gmail outbox.
 * Returns 404 outside of test mode so the outbox never leaks.
 */
function guard(): NextResponse | null {
	if (!isGmailTestMode()) {
		return NextResponse.json({ error: "Not Found" }, { status: 404 });
	}
	return null;
}

export async function GET() {
	const blocked = guard();
	if (blocked) return blocked;
	const emails = getGmailTestOutbox();
	return NextResponse.json({ count: emails.length, emails });
}

export async function DELETE() {
	const blocked = guard();
	if (blocked) return blocked;
	clearGmailTestOutbox();
	return NextResponse.json({ success: true });
}
