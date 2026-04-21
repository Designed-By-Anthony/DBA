import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";

/**
 * Apex-operator allowlist for admin routes that manipulate shared infrastructure
 * (e.g. the single Cloudflare zone: DNS records + custom hostnames).
 *
 * Before this helper every authenticated org member could list / create / delete
 * DNS records in the shared zone, which was cross-tenant catastrophic.
 *
 * Until a proper per-tenant Cloudflare-zone model is wired up, this route is
 * restricted to a small allowlist populated via env:
 *
 *   ADMIN_ALLOWED_ORG_IDS=org_XXXX,org_YYYY   (Clerk org ids, comma-separated)
 *   ADMIN_ALLOWED_USER_IDS=user_XXXX,user_YYYY (Clerk user ids, comma-separated)
 *
 * Either list matching is sufficient. If BOTH vars are empty the helper
 * rejects every request (fails closed) — leaving them blank is how you
 * disable the route entirely.
 */
export async function assertApexOperator(): Promise<
	| { ok: true; userId: string; orgId: string | null }
	| { ok: false; status: 401 | 403 | 503; message: string }
> {
	if (!process.env.CLERK_SECRET_KEY) {
		return { ok: false, status: 503, message: "Auth not configured" };
	}

	const { userId, orgId } = await auth();
	if (!userId) {
		return { ok: false, status: 401, message: "Unauthorized" };
	}

	const allowedOrgs = parseCsv(process.env.ADMIN_ALLOWED_ORG_IDS);
	const allowedUsers = parseCsv(process.env.ADMIN_ALLOWED_USER_IDS);

	// Empty allowlist = route disabled. Refuse even valid sessions.
	if (allowedOrgs.length === 0 && allowedUsers.length === 0) {
		console.warn(
			"[admin-allowlist] rejecting request: both ADMIN_ALLOWED_ORG_IDS and ADMIN_ALLOWED_USER_IDS are empty",
		);
		return { ok: false, status: 503, message: "Admin route disabled" };
	}

	const userOk = allowedUsers.includes(userId);
	const orgOk = orgId ? allowedOrgs.includes(orgId) : false;
	if (!userOk && !orgOk) {
		return { ok: false, status: 403, message: "Forbidden" };
	}

	return { ok: true, userId, orgId: orgId ?? null };
}

function parseCsv(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}
