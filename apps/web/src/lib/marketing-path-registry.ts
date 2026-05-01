import { blogPosts } from "@/data/blogPosts";
import { COMPARE_COMPETITORS } from "@/data/compare-competitors";
import { getAllServiceAreaSlugs } from "@/data/serviceAreaLocations";
import { showcaseItems } from "@/data/showcase";
import { listAllInfrastructurePaths } from "@/lib/programmaticSeo";
import { MARKETING_SERVICES } from "@/lib/seo";

/** Single-page marketing slugs handled by `(site)/[...path]`. */
export const STATIC_MARKETING_SLUGS = [
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

/**
 * All indexable marketing URLs (no trailing slash). Keep aligned with
 * `src/app/(site)/[...path]/page.tsx` `generateStaticParams`.
 */
export function getMarketingSitemapPathnames(): string[] {
	const paths = new Set<string>(["/"]);

	paths.add("/lighthouse");

	paths.add("/services");
	for (const s of MARKETING_SERVICES) {
		paths.add(s.path);
	}

	paths.add("/blog");
	for (const post of blogPosts) {
		paths.add(post.url);
	}

	paths.add("/portfolio");
	for (const item of showcaseItems) {
		if (item.caseStudySlug) {
			paths.add(`/portfolio/${item.caseStudySlug}`);
		}
	}

	for (const slug of STATIC_MARKETING_SLUGS) {
		paths.add(`/${slug}`);
	}

	paths.add("/tools");
	paths.add("/calculator");

	for (const { slug } of COMPARE_COMPETITORS) {
		paths.add(`/compare/${slug}`);
	}

	for (const { city, industry } of listAllInfrastructurePaths()) {
		paths.add(`/infrastructure/${city}/${industry}`);
	}

	for (const slug of getAllServiceAreaSlugs()) {
		paths.add(`/service-areas/${slug}`);
	}

	return [...paths].sort((a, b) => a.localeCompare(b));
}
