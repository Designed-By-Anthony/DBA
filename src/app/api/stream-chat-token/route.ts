import { StreamChat } from "stream-chat";
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
	"https://designedbyanthony.com",
	"https://www.designedbyanthony.com",
	"http://localhost:4321",
	"http://127.0.0.1:4321",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
]);

function corsHeaders(origin: string | null): HeadersInit {
	const o =
		origin && ALLOWED_ORIGINS.has(origin)
			? origin
			: "https://designedbyanthony.com";
	return {
		"Access-Control-Allow-Origin": o,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		Vary: "Origin",
	};
}

function apiKey(): string | undefined {
	return (
		process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY?.trim() ||
		process.env.PUBLIC_STREAM_CHAT_API_KEY?.trim()
	);
}

/**
 * Issues a short-lived Stream Chat user token for the marketing-site widget.
 * Secret key stays server-side; client only receives the user JWT.
 */
export async function POST(request: Request) {
	const origin = request.headers.get("origin");
	const headers = corsHeaders(origin);

	const key = apiKey();
	const secret = process.env.STREAM_CHAT_SECRET?.trim();

	if (!key || !secret) {
		return NextResponse.json(
			{ error: "Chat is not configured." },
			{ status: 503, headers },
		);
	}

	let body: { userId?: string; userName?: string };
	try {
		body = (await request.json()) as { userId?: string; userName?: string };
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
	}

	const rawId = typeof body.userId === "string" ? body.userId.trim() : "";
	if (!rawId || rawId.length > 128) {
		return NextResponse.json({ error: "userId required" }, { status: 400, headers });
	}

	const safeId =
		rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "visitor";
	const userName =
		typeof body.userName === "string" && body.userName.trim()
			? body.userName.trim().slice(0, 80)
			: "Website visitor";

	const inboxUserId = (
		process.env.STREAM_CHAT_INBOX_USER_ID?.trim() || "DBAStudio315"
	).slice(0, 64);
	const inboxName =
		process.env.STREAM_CHAT_INBOX_NAME?.trim() || "Designed by Anthony";

	const serverClient = StreamChat.getInstance(key, secret);

	await serverClient.upsertUser({
		id: safeId,
		name: userName,
		role: "user",
	});
	await serverClient.upsertUser({
		id: inboxUserId,
		name: inboxName,
		role: "user",
	});

	const token = serverClient.createToken(safeId);

	return NextResponse.json(
		{ token, apiKey: key, userId: safeId, inboxUserId },
		{ status: 200, headers },
	);
}

export async function OPTIONS(request: Request) {
	const origin = request.headers.get("origin");
	return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
