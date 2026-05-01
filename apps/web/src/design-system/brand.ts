import type { StaticImageData } from "next/image";
import brandMarkImage from "./brand-mark.webp";

/**
 * ANTHONY. — brand asset constants.
 *
 * Single source of truth for logo paths served by each app.
 *
 * Logos ship from `public/brand/...` at `/brand/logo.png` and
 * `/brand/logo-full.png`. The square **mark** is also bundled from
 * `./brand-mark.webp` so `<Image>` always resolves in hosts where
 * `public/` statics are flaky; `/brand/mark.webp` remains for direct URLs.
 *
 * NEVER hardcode logo paths in individual components — import one of
 * the constants below so a rename touches a single file.
 */
/** Public wordmark — displayed as Fraunces + bronze period in chrome. */
export const BRAND_NAME = "ANTHONY.";

/** Bundled mark for `next/image` (avoids 404 when `/public` statics mis-deploy). */
export const BRAND_MARK_IMAGE: StaticImageData = brandMarkImage;

/** Canonical public site URL (production). */
export const BRAND_SITE_URL = "https://designedbyanthony.com";

/** Public URL paths served by every app. Absolute-from-root (`/brand/...`). */
export const BRAND_ASSETS = {
	/** Horizontal brand lockup (full-width logo). */
	logo: "/brand/logo.png",
	/** Horizontal brand lockup, larger source (for retina/print). */
	logoFull: "/brand/logo-full.png",
	/** Master wordmark — isolated ANTHONY. + bronze period (PNG from SVG source). */
	masterWordmark: "/logos/anthony_master_wordmark.png",
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
