/**
 * Mirrors `apps/web/src/lib/marketing-routes.ts` without importing the web app
 * graph (webp imports break Playwright's TS transform).
 */
import { blogPosts } from "../../apps/web/src/data/blogPosts";
import { getAllServiceAreaSlugs } from "../../apps/web/src/data/serviceAreaLocations";

const PORTFOLIO_CASE_STUDY_SLUGS = ["the-long-beach-handyman"] as const;

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

const MARKETING_SERVICE_PATHS = [
	"/services/custom-web-design",
	"/services/website-rescue",
	"/services/managed-hosting",
	"/services/local-seo",
	"/services/google-business-profile",
	"/services/workspace-setup",
	"/services/micro-saas",
] as const;

/** Every browser-navigable marketing path (same contract as `getAllMarketingPathnames` in web). */
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
	for (const p of MARKETING_SERVICE_PATHS) {
		paths.add(p);
	}

	paths.add("/blog");
	for (const post of blogPosts) {
		paths.add(post.url);
	}

	paths.add("/portfolio");
	for (const slug of PORTFOLIO_CASE_STUDY_SLUGS) {
		paths.add(`/portfolio/${slug}`);
	}

	return Array.from(paths).sort((a, b) => a.localeCompare(b));
}
