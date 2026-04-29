import type { Metadata } from "next";
import { blogPosts } from "@/data/blogPosts";
import {
	getServiceAreaLocation,
	isServiceAreaSlug,
} from "@/data/serviceAreaLocations";
import { showcaseItems } from "@/data/showcase";
import { staticMarketingPageCopy } from "@/data/staticMarketingPages";
import { DEFAULT_SOCIAL_IMAGE, MARKETING_SERVICES, SITE_NAME } from "@/lib/seo";

const SITE = "https://designedbyanthony.com";

const OG_DEFAULT_W = 1200;
const OG_DEFAULT_H = 630;

function pathToSegments(path: string[]): string {
	if (!path.length) return "/";
	return `/${path.join("/")}`;
}

/**
 * Full metadata for marketing catch-all routes. Titles are short strings
 * (no `| ${SITE_NAME}`) so `layout.tsx` title.template applies once.
 */
export function resolveMarketingMetadata(path: string[]): Metadata {
	const pathname = pathToSegments(path);
	const [a, b] = path;

	const base: Metadata = {
		alternates: { canonical: pathname },
	};

	if (a === "thank-you" || a === "facebook-offer") {
		const copy = staticMarketingPageCopy[a];
		return {
			...base,
			title: copy.title,
			description: copy.description,
			robots: { index: false, follow: false },
			openGraph: {
				title: `${copy.title} | ${SITE_NAME}`,
				description: copy.description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
			},
			twitter: {
				card: "summary",
				title: `${copy.title} | ${SITE_NAME}`,
				description: copy.description,
			},
		};
	}

	if (a === "services" && path.length === 1) {
		const title = "Services";
		const description =
			"Custom web design, local SEO, managed hosting, website rescues, Google Business Profile programs, workspace setup, and AI-assisted lead capture for Mohawk Valley and Central NY service businesses.";
		return {
			...base,
			title,
			description,
			openGraph: {
				title: `${title} | ${SITE_NAME}`,
				description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: SITE_NAME,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${title} | ${SITE_NAME}`,
				description,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	if (a === "services" && b && path.length === 2) {
		const service = MARKETING_SERVICES.find((s) => s.path === `/services/${b}`);
		if (!service) return { ...base, title: "Services" };
		return {
			...base,
			title: service.name,
			description: service.description,
			openGraph: {
				title: `${service.name} | ${SITE_NAME}`,
				description: service.description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: service.name,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${service.name} | ${SITE_NAME}`,
				description: service.description,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	if (a === "blog" && path.length === 1) {
		const title = "Blog";
		const description =
			"Local SEO, performance, and how we build fast marketing websites for contractors and service businesses in Central New York and beyond.";
		return {
			...base,
			title,
			description,
			openGraph: {
				title: `${title} | ${SITE_NAME}`,
				description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: SITE_NAME,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${title} | ${SITE_NAME}`,
				description,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	if (a === "blog" && b && path.length === 2) {
		const post = blogPosts.find((p) => p.url === `/blog/${b}`);
		if (!post) {
			return {
				...base,
				title: "Blog",
				description: "Articles on local SEO, performance, and web design.",
			};
		}
		const absImage = post.image.startsWith("http")
			? post.image
			: `${SITE}${post.image}`;
		return {
			...base,
			title: post.title,
			description: post.excerpt,
			openGraph: {
				title: `${post.title} | ${SITE_NAME}`,
				description: post.excerpt,
				url: pathname,
				siteName: SITE_NAME,
				type: "article",
				publishedTime: post.publishedTime,
				images: [
					{
						url: absImage,
						width: post.imageWidth,
						height: post.imageHeight,
						alt: post.imageAlt,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${post.title} | ${SITE_NAME}`,
				description: post.excerpt,
				images: [absImage],
			},
		};
	}

	if (a === "portfolio" && path.length === 1) {
		const copy = staticMarketingPageCopy.portfolio;
		return {
			...base,
			title: copy.title,
			description: copy.description,
			openGraph: {
				title: `${copy.title} | ${SITE_NAME}`,
				description: copy.description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: copy.title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${copy.title} | ${SITE_NAME}`,
				description: copy.description,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	if (a === "portfolio" && b && path.length === 2) {
		const item = showcaseItems.find((i) => i.caseStudySlug === b);
		if (!item) {
			return {
				...base,
				title: "Portfolio",
				description: staticMarketingPageCopy.portfolio.description,
			};
		}
		const absImage = item.image.startsWith("http")
			? item.image
			: `${SITE}${item.image}`;
		return {
			...base,
			title: item.name,
			description: item.description,
			openGraph: {
				title: `${item.name} | ${SITE_NAME}`,
				description: item.description,
				url: pathname,
				siteName: SITE_NAME,
				type: "article",
				images: [
					{
						url: absImage,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: item.imageAlt ?? `${item.name} portfolio case study`,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${item.name} | ${SITE_NAME}`,
				description: item.description,
				images: [absImage],
			},
		};
	}

	if (a === "service-areas" && b && path.length === 2 && isServiceAreaSlug(b)) {
		const loc = getServiceAreaLocation(b);
		if (!loc) return { ...base, title: "Service Areas" };
		const title = `Web design & local SEO — ${loc.name}`;
		return {
			...base,
			title,
			description: loc.metaDescription,
			openGraph: {
				title: `${title} | ${SITE_NAME}`,
				description: loc.metaDescription,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${title} | ${SITE_NAME}`,
				description: loc.metaDescription,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	const staticCopy = staticMarketingPageCopy[a];
	if (path.length === 1 && staticCopy) {
		return {
			...base,
			title: staticCopy.title,
			description: staticCopy.description,
			openGraph: {
				title: `${staticCopy.title} | ${SITE_NAME}`,
				description: staticCopy.description,
				url: pathname,
				siteName: SITE_NAME,
				type: "website",
				images: [
					{
						url: DEFAULT_SOCIAL_IMAGE,
						width: OG_DEFAULT_W,
						height: OG_DEFAULT_H,
						alt: staticCopy.title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title: `${staticCopy.title} | ${SITE_NAME}`,
				description: staticCopy.description,
				images: [DEFAULT_SOCIAL_IMAGE],
			},
		};
	}

	return {
		...base,
		title: SITE_NAME,
		description:
			"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
		openGraph: {
			title: SITE_NAME,
			description:
				"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
			url: pathname,
			siteName: SITE_NAME,
			type: "website",
			images: [
				{
					url: DEFAULT_SOCIAL_IMAGE,
					width: OG_DEFAULT_W,
					height: OG_DEFAULT_H,
					alt: SITE_NAME,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: SITE_NAME,
			description:
				"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
			images: [DEFAULT_SOCIAL_IMAGE],
		},
	};
}
