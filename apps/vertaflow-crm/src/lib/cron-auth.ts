import crypto from "crypto";

/**
 * Length-safe constant-time string compare. Exported locally so this module
 * is independent of other security helpers landing in parallel PRs.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
	const aBuf = Buffer.from(a, "utf8");
	const bBuf = Buffer.from(b, "utf8");
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Verify a Vercel-Cron-compatible Authorization header.
 *
 * Compares `Authorization: Bearer <CRON_SECRET>` in constant time. Previous
 * implementations used `!==` (minor timing oracle) and some also honored a
 * `?secret=<value>` query-string parameter — the query string is logged by
 * CDN / Vercel access logs, ends up in browser history and referrers, and
 * is therefore not a safe place to transport a shared secret.
 *
 * In production (`VERCEL_ENV === 'production'`, or `NODE_ENV === 'production'`
 * with `VERCEL === '1'`), a missing `CRON_SECRET` results in the route
 * rejecting every request (including legitimate Vercel-scheduled invocations)
 * rather than silently becoming world-callable.
 */
export function verifyCronAuth(
	request: Request,
): { ok: true } | { ok: false; status: number; message: string } {
	const expected = process.env.CRON_SECRET || "";

	if (!expected) {
		const isProd =
			process.env.VERCEL_ENV === "production" ||
			(process.env.NODE_ENV === "production" && process.env.VERCEL === "1");
		if (isProd) {
			console.error(
				"[cron] rejected: CRON_SECRET not configured in production",
			);
			return { ok: false, status: 503, message: "Cron not configured" };
		}
		// Dev / preview with no CRON_SECRET — allow local experimentation.
		return { ok: true };
	}

	const auth = request.headers.get("authorization") || "";
	if (!auth.startsWith("Bearer ")) {
		return { ok: false, status: 401, message: "Unauthorized" };
	}
	const provided = auth.slice("Bearer ".length);
	if (!timingSafeEqualStr(provided, expected)) {
		return { ok: false, status: 401, message: "Unauthorized" };
	}
	return { ok: true };
}
