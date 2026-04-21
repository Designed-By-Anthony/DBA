import { NextResponse } from "next/server";
import {
	clearTestDiscordNotifications,
	getTestDiscordNotifications,
} from "@/lib/services/notifications";
import { isTestMode } from "@/lib/test-mode";

function testAllowed() {
	return (
		isTestMode() ||
		process.env.NODE_ENV === "test" ||
		process.env.EMAIL_TEST_MODE === "true"
	);
}

export async function GET() {
	if (!testAllowed()) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const notifications = getTestDiscordNotifications();
	return NextResponse.json({ count: notifications.length, notifications });
}

export async function DELETE() {
	if (!testAllowed()) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	clearTestDiscordNotifications();
	return NextResponse.json({ ok: true });
}
