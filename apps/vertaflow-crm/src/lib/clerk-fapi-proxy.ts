import "server-only";

/**
 * When Clerk’s script host is a custom `clerk.<domain>` that has no DNS yet, the
 * browser cannot load clerk-js. Optional mitigations:
 * - Set `NEXT_PUBLIC_CLERK_PROXY_URL` to `https://<instance>.clerk.accounts.dev`, or
 * - Set `CLERK_FAPI_UPSTREAM` to that same URL (server-only); we then use a
 *   same-origin relative proxy (`/clerk-fapi/*` → upstream) so the publishable
 *   key can stay on the custom FAPI hostname without manual `NEXT_PUBLIC_*` duplication.
 */
export function clerkProxyUrlForProvider(): string | undefined {
	const explicit = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
	if (explicit) return explicit;

	const upstream = process.env.CLERK_FAPI_UPSTREAM?.trim();
	if (upstream) return "/clerk-fapi";

	return undefined;
}
