import type { ReactNode } from "react";
import { getArticleBlocksForSlug } from "@/data/blogArticleBlocks";
import { blogPosts } from "@/data/blogPosts";
import { isServiceAreaSlug } from "@/data/serviceAreaLocations";
import { showcaseItems } from "@/data/showcase";
import { staticMarketingPageCopy } from "@/data/staticMarketingPages";
import {
	buildBlogPostingSchema,
	buildBreadcrumbSchema,
	buildBreadcrumbs,
	buildItemListSchema,
	buildMarketingWebPageSchema,
	buildServiceSchema,
	MARKETING_SERVICES,
} from "@/lib/seo";

function JsonLd({ data }: { data: unknown }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}

/** JSON-LD emitted inside enriched page components — skip duplicate graphs here. */
const ENRICHED_JSONLD_SEGMENTS = new Set([
	"about",
	"pricing",
	"ouredge",
	"faq",
	"service-areas",
]);

/**
 * Per-route JSON-LD for marketing catch-all pages (not the homepage — see
 * `src/app/(site)/page.tsx` for home). Enriched routes attach their own WebPage
 * + extras in `EnrichedPages.tsx`.
 */
export function MarketingJsonLd({ path }: { path: string[] }) {
	const [a, b] = path;
	if (path.length === 1 && ENRICHED_JSONLD_SEGMENTS.has(a)) {
		return null;
	}
	if (a === "service-areas" && b && path.length === 2 && isServiceAreaSlug(b)) {
		return null;
	}

	const pathname =
		path.length === 0 ? "/" : `/${path.filter(Boolean).join("/")}`;

	const blocks: ReactNode[] = [];

	const pushWebPageBreadcrumb = (pageName: string, description: string) => {
		const crumbs = buildBreadcrumbs(pathname, pageName);
		const webPage = buildMarketingWebPageSchema({
			pathname,
			name: pageName,
			description,
		});
		blocks.push(<JsonLd key={`webpage-${pathname}`} data={webPage} />);
		const bc = buildBreadcrumbSchema(pathname, crumbs);
		if (bc) {
			blocks.push(<JsonLd key={`breadcrumb-${pathname}`} data={bc} />);
		}
	};

	if (a === "services" && path.length === 1) {
		const title = "Services";
		const description =
			"Custom web design, local SEO, managed hosting, website rescues, and Google Business Profile programs for Mohawk Valley and Central NY service businesses.";
		pushWebPageBreadcrumb(title, description);
		blocks.push(
			<JsonLd
				key="services-itemlist"
				data={buildItemListSchema({
					name: title,
					description,
					path: pathname,
					items: MARKETING_SERVICES.map((s) => ({
						name: s.name,
						url: s.path,
						description: s.description,
					})),
				})}
			/>,
		);
		return <>{blocks}</>;
	}

	if (a === "services" && b && path.length === 2) {
		const service = MARKETING_SERVICES.find((s) => s.path === `/services/${b}`);
		if (!service) return null;
		pushWebPageBreadcrumb(service.name, service.description);
		blocks.push(
			<JsonLd
				key={service.path}
				data={buildServiceSchema({
					name: service.name,
					description: service.description,
					path: service.path,
				})}
			/>,
		);
		return <>{blocks}</>;
	}

	if (a === "blog" && path.length === 1) {
		const title = "Blog";
		const description =
			"Articles on local SEO, performance, and custom websites for service businesses.";
		pushWebPageBreadcrumb(title, description);
		blocks.push(
			<JsonLd
				key="blog-itemlist"
				data={buildItemListSchema({
					name: "The Main Street Blog",
					description,
					path: pathname,
					items: blogPosts.map((p) => ({
						name: p.title,
						url: p.url,
						description: p.excerpt,
						image: p.image,
					})),
				})}
			/>,
		);
		return <>{blocks}</>;
	}

	if (a === "blog" && b && path.length === 2) {
		const post = blogPosts.find((p) => p.url === `/blog/${b}`);
		if (!post) return null;
		pushWebPageBreadcrumb(post.title, post.excerpt);
		const keywords = getArticleBlocksForSlug(b)
			?.filter((block) => block.type === "h2" || block.type === "h3")
			.map((block) => ("text" in block ? block.text : ""))
			.filter(Boolean)
			.slice(0, 12);
		blocks.push(
			<JsonLd
				key={post.url}
				data={buildBlogPostingSchema({
					headline: post.title,
					description: post.excerpt,
					path: post.url,
					image: post.image,
					datePublished: post.publishedTime,
					articleSection: "Local SEO & Web Design",
					keywords: keywords?.length ? keywords : undefined,
				})}
			/>,
		);
		return <>{blocks}</>;
	}

	if (a === "portfolio" && path.length === 1) {
		const copy = staticMarketingPageCopy.portfolio;
		pushWebPageBreadcrumb(copy.title, copy.description);
		return <>{blocks}</>;
	}

	if (a === "portfolio" && b && path.length === 2) {
		const item = showcaseItems.find((i) => i.caseStudySlug === b);
		if (!item) return null;
		pushWebPageBreadcrumb(item.name, item.description);
		return <>{blocks}</>;
	}

	if (path.length === 1 && staticMarketingPageCopy[a]) {
		const copy = staticMarketingPageCopy[a];
		pushWebPageBreadcrumb(copy.title, copy.description);
		return <>{blocks}</>;
	}

	return null;
}
