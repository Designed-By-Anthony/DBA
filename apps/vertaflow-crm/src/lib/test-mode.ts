/**
 * Server-only test-mode gate.
 *
 * Replaces the ambient `process.env.NEXT_PUBLIC_IS_TEST === 'true'` checks that used to
 * live inside API routes and admin server actions. Those checks were dangerous for two
 * reasons:
 *
 *   1. `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time, so
 *      a misconfigured prod build would expose "test mode is on" to every browser user.
 *   2. Several of the branches guarded by that flag short-circuited security checks
 *      (Stripe signature verification, magic-link token echo-back). Flipping the flag
 *      on in prod = full webhook spoofing + full portal account takeover.
 *
 * This helper intentionally:
 *   - Reads from `IS_TEST` (no `NEXT_PUBLIC_` prefix — server-only).
 *   - Refuses to return `true` when we look like Vercel production, regardless of the
 *     env value. If somebody fat-fingers `IS_TEST=true` in the prod environment group,
 *     we still fail closed.
 */
export function isTestMode(): boolean {
	if (process.env.IS_TEST !== "true") return false;
	if (process.env.VERCEL_ENV === "production") return false;
	if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1")
		return false;
	return true;
}
