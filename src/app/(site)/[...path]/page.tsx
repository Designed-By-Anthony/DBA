import "@/app/home-page.css";
import "@/app/marketing-site-pages.css";
import { MarketingSiteRouter } from "@/components/marketing/MarketingSitePages";
import { blogPosts } from "@/data/blogPosts";
import { showcaseItems } from "@/data/showcase";
import { MARKETING_SERVICES, SITE_NAME } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
	params: Promise<{ path: string[] }>;
};

function titleForPath(path: string[]): string {
	const [a, b] = path;
	if (a === "services" && path.length === 1) return `Services | ${SITE_NAME}`;
	if (a === "services" && b) {
		const s = MARKETING_SERVICES.find((x) => x.path === `/services/${b}`);
		return s ? `${s.name} | ${SITE_NAME}` : SITE_NAME;
	}
	if (a === "blog" && path.length === 1) return `Blog | ${SITE_NAME}`;
	if (a === "blog" && b) {
		const p = blogPosts.find((x) => x.url === `/blog/${b}`);
		return p ? `${p.title} | ${SITE_NAME}` : `Blog | ${SITE_NAME}`;
	}
	if (a === "portfolio" && path.length === 1) return `Portfolio | ${SITE_NAME}`;
	if (a === "portfolio" && b) {
		const c = showcaseItems.find((i) => i.caseStudySlug === b);
		return c ? `${c.name} | ${SITE_NAME}` : `Portfolio | ${SITE_NAME}`;
	}
	if (a === "thank-you") return `Thank you | ${SITE_NAME}`;
	const labels: Record<string, string> = {
		about: "About",
		contact: "Contact",
		pricing: "Pricing",
		faq: "FAQ",
		ouredge: "Our Edge",
		"service-areas": "Service Areas",
		"free-seo-audit": "Free Website Audit",
		privacy: "Privacy Policy",
		terms: "Terms of Service",
		cookie: "Cookie Policy",
		"image-license": "Image License",
		"facebook-offer": "Facebook offer",
		"404": "Page not found",
	};
	return labels[a] ? `${labels[a]} | ${SITE_NAME}` : SITE_NAME;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { path } = await params;
	return {
		title: titleForPath(path),
	};
}

export async function generateStaticParams(): Promise<{ path: string[] }[]> {
	const paths: { path: string[] }[] = [];

	paths.push({ path: ["services"] });
	for (const s of MARKETING_SERVICES) {
		const segs = s.path.split("/").filter(Boolean);
		if (segs.length) paths.push({ path: segs });
	}

	paths.push({ path: ["blog"] });
	for (const post of blogPosts) {
		const segs = post.url.split("/").filter(Boolean);
		if (segs.length) paths.push({ path: segs });
	}

	paths.push({ path: ["portfolio"] });
	for (const item of showcaseItems) {
		if (item.caseStudySlug) {
			paths.push({ path: ["portfolio", item.caseStudySlug] });
		}
	}

	const staticSlugs = [
		"about",
		"contact",
		"pricing",
		"faq",
		"ouredge",
		"service-areas",
		"free-seo-audit",
		"privacy",
		"terms",
		"cookie",
		"image-license",
		"thank-you",
		"facebook-offer",
		"404",
	];
	for (const slug of staticSlugs) {
		paths.push({ path: [slug] });
	}

	return paths;
}

export default async function MarketingCatchAllPage({ params }: PageProps) {
	const { path } = await params;
	if (!path?.length) notFound();
	return <MarketingSiteRouter path={path} />;
}
