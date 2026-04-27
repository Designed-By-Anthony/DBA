import { blogPosts } from "@/data/blogPosts";
import { getAllServiceAreaSlugs } from "@/data/serviceAreaLocations";
import { MARKETING_SERVICES } from "@/lib/seo";

/**
 * Portfolio case-study URL segments — must match `caseStudySlug` on entries in
 * `src/data/showcase.ts` (that module imports PNGs and cannot load in Playwright).
 */
const PORTFOLIO_CASE_STUDY_SLUGS = ["the-long-beach-handyman"] as const;

/**
 * Single-segment marketing paths handled by `MarketingSiteRouter` static
 * pages and `generateStaticParams` — keep in sync with `[...path]/page.tsx`.
 */
export const MARKETING_SINGLE_SEGMENT_SLUGS = [
	"about",
	"contact",
	"pricing",
	"faq",
	"ouredge",
	"service-areas",
	"privacy",
	"terms",
	"cookie",
	"image-license",
	"thank-you",
	"facebook-offer",
] as const;

/** Every browser-navigable marketing path we ship (for smoke / ZAP / render checks). */
export function getAllMarketingPathnames(): string[] {
	const paths = new Set<string>(["/"]);

	for (const slug of MARKETING_SINGLE_SEGMENT_SLUGS) {
		paths.add(`/${slug}`);
	}

	for (const areaSlug of getAllServiceAreaSlugs()) {
		paths.add(`/service-areas/${areaSlug}`);
	}

	paths.add("/404");
	paths.add("/page-not-found");

	paths.add("/services");
	for (const s of MARKETING_SERVICES) {
		paths.add(s.path);
	}

	paths.add("/blog");
	for (const post of blogPosts) {
		paths.add(post.url);
	}

	paths.add("/portfolio");
	for (const slug of PORTFOLIO_CASE_STUDY_SLUGS) {
		paths.add(`/portfolio/${slug}`);
	}

	/* `/lighthouse` returns 404 on the apex host by design (proxy); it lives on lighthouse.* */

	return Array.from(paths).sort((a, b) => a.localeCompare(b));
}
