import { getDb, portalSessions } from "@dba/database";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { hashPortalToken } from "@/lib/portal-auth";
import {
	HOST_PREFIXED_COOKIE_NAME,
	LEGACY_COOKIE_NAME,
	portalCookieNamesToRead,
} from "@/lib/portal-cookie";

/**
 * POST /api/portal/logout
 *
 * Invalidates the current portal session both server-side (delete the
 * portal_sessions row matching the cookie's token hash) and client-side
 * (expire every cookie name we might have issued — new prefixed + legacy —
 * so no stale cookie can reauthenticate). Idempotent; safe to call
 * unauthenticated.
 */
export async function POST(request: NextRequest) {
	let sessionToken: string | undefined;
	for (const name of portalCookieNamesToRead()) {
		const v = request.cookies.get(name)?.value;
		if (v) {
			sessionToken = v;
			break;
		}
	}

	const response = NextResponse.json({ success: true });

	// Expire both names on the way out. The __Host- variant MUST be sent with
	// secure+path=/ and no Domain, same rules as when it was set.
	response.cookies.set(HOST_PREFIXED_COOKIE_NAME, "", {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		expires: new Date(0),
		path: "/",
	});
	response.cookies.set(LEGACY_COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.VERCEL === "1" || process.env.NODE_ENV === "production",
		sameSite: "strict",
		expires: new Date(0),
		path: "/",
	});

	if (sessionToken) {
		try {
			const database = getDb();
			if (database) {
				const tokenHash = hashPortalToken(sessionToken);
				await database
					.delete(portalSessions)
					.where(eq(portalSessions.sessionTokenHash, tokenHash));
			}
		} catch (err) {
			// Log only — cookie is cleared either way.
			console.error("[portal/logout] session delete failed:", err);
		}
	}

	return response;
}
