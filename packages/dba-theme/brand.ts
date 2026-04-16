/**
 * Designed by Anthony — brand asset constants.
 *
 * Single source of truth for logo paths served by each app.
 *
 * Each app ships a mirrored copy of the canonical files under
 * `public/brand/...` so Next.js (and Astro’s public/) can serve them
 * from `/brand/logo.png`, `/brand/mark.webp`, and `/brand/logo-full.png`.
 * The files on disk live at `packages/dba-theme/brand/` and are copied
 * into each app during setup (see README / scripts).
 *
 * NEVER hardcode logo paths in individual components — import one of
 * the constants below so a rename touches a single file.
 */
export const BRAND_NAME = "Designed by Anthony";

/** Canonical public site URL (production). */
export const BRAND_SITE_URL = "https://designedbyanthony.com";

/** Public URL paths served by every app. Absolute-from-root (`/brand/...`). */
export const BRAND_ASSETS = {
  /** Horizontal brand lockup (full-width logo). */
  logo: "/brand/logo.png",
  /** Horizontal brand lockup, larger source (for retina/print). */
  logoFull: "/brand/logo-full.png",
  /** Square/icon mark — used in dense UI chrome (sidebars, PWA). */
  mark: "/brand/mark.webp",
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

/** Build an absolute URL for a brand asset (for OG images, JSON-LD, etc.). */
export function brandAssetUrl(
  key: BrandAssetKey,
  siteUrl: string = BRAND_SITE_URL,
): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${BRAND_ASSETS[key]}`;
}
