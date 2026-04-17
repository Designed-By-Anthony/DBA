/**
 * Portal-session cookie naming, with a compat window.
 *
 * Why two names?
 *  - The `__Host-` prefix gives us:
 *      * a guarantee the cookie cannot be set by a subdomain (no Domain attr),
 *      * a browser-enforced requirement that the cookie be Secure + path=/,
 *      * no overlap with a cookie of the same name on a sibling host.
 *    These properties matter for a portal-session cookie and are free to enable
 *    in production (Vercel is HTTPS-only).
 *
 *  - But __Host- cookies can only be set over HTTPS. Local `next dev` over
 *    plain HTTP cannot accept one. For dev we fall back to the unprefixed name.
 *
 *  - We read BOTH names so existing sessions created under the old name don't
 *    instantly log out when this ships. After the compat window (see below)
 *    the legacy read can be deleted.
 *
 * Compat-window removal policy
 *   portalSessions.expiresAt is 7 days. Once this is deployed, wait at least
 *   14 days (2x the session TTL) before removing LEGACY_COOKIE_NAME from
 *   getPortalSessionFromRequest() and from the logout route. Any still-valid
 *   session older than 14 days is already expired by definition, so there is
 *   nothing to preserve.
 */

export const LEGACY_COOKIE_NAME = "portal_session";
export const HOST_PREFIXED_COOKIE_NAME = "__Host-portal_session";

/**
 * Pick the cookie name to SET on new sessions.
 *
 * `__Host-` requires HTTPS. We treat "we're on Vercel" (preview or prod) as
 * "HTTPS is available" — Vercel never serves HTTP for a Vercel-hosted route.
 * Otherwise (local dev, next start over http, custom self-hosted HTTP) we
 * keep the old name so the browser actually accepts the cookie.
 */
export function portalCookieNameToSet(): string {
  if (process.env.VERCEL === "1") return HOST_PREFIXED_COOKIE_NAME;
  if (process.env.NODE_ENV === "production") return HOST_PREFIXED_COOKIE_NAME;
  return LEGACY_COOKIE_NAME;
}

/** Every cookie name we might need to READ to find an existing session. */
export function portalCookieNamesToRead(): readonly string[] {
  return [HOST_PREFIXED_COOKIE_NAME, LEGACY_COOKIE_NAME];
}
