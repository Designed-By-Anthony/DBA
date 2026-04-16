/**
 * Clerk bypass for /admin (layout, middleware, verifyAuth) — local dev and E2E only.
 *
 * - Local `pnpm dev`: NODE_ENV=development and not on Vercel → bypass without extra env.
 * - Playwright / NODE_ENV=test: set ALLOW_ADMIN_AUTH_BYPASS=1 (see playwright.config.ts, .env.test).
 * - Vercel (preview + production): NODE_ENV=production → never bypass via NODE_ENV; hosted
 *   `vercel dev` uses VERCEL=1 with development — bypass off unless you explicitly set ALLOW_ADMIN_AUTH_BYPASS=1.
 */
export function isAdminAuthDevBypassEnabled(): boolean {
  if (process.env.ALLOW_ADMIN_AUTH_BYPASS === "1") return true;
  if (process.env.ALLOW_ADMIN_AUTH_BYPASS === "0") return false;

  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.VERCEL === "1") return false;

  return true;
}
