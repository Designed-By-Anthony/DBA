import { getDb, portalSessions } from "@dba/database";
import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { portalCookieNamesToRead } from "@/lib/portal-cookie";

export type PortalSession = {
	tenantId: string;
	prospectId: string;
	prospectEmail: string;
	prospectName: string;
};

function hashToken(value: string): string {
	return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPortalToken(value: string): string {
	return hashToken(value);
}

/**
 * Validate current portal session from cookie and return scoped tenant identity.
 *
 * Reads both the `__Host-portal_session` and the legacy `portal_session` cookie
 * name so that sessions issued before the rollout continue to work through the
 * compat window. Prefers the `__Host-` one when both are present — only the
 * browser can set a `__Host-` cookie with full binding guarantees.
 */
export async function getPortalSessionFromRequest(
	request: NextRequest,
): Promise<PortalSession | null> {
	let sessionToken: string | undefined;
	for (const name of portalCookieNamesToRead()) {
		const v = request.cookies.get(name)?.value;
		if (v) {
			sessionToken = v;
			break;
		}
	}
	if (!sessionToken) return null;

	const database = getDb();
	if (!database) return null;

	const nowIso = new Date().toISOString();
	const tokenHash = hashToken(sessionToken);

	const rows = await database
		.select()
		.from(portalSessions)
		.where(
			and(
				eq(portalSessions.sessionTokenHash, tokenHash),
				gt(portalSessions.expiresAt, nowIso),
			),
		)
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	return {
		tenantId: row.tenantId,
		prospectId: row.prospectId,
		prospectEmail: row.prospectEmail,
		prospectName: row.prospectName,
	};
}
