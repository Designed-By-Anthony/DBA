import "@/app/home-page.css";
import "@/app/marketing-site-pages.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingJsonLd } from "@/components/marketing/MarketingJsonLd";
import { MarketingSiteRouter } from "@/components/marketing/MarketingSitePages";
import { blogPosts } from "@/data/blogPosts";
import { getAllServiceAreaSlugs } from "@/data/serviceAreaLocations";
import { showcaseItems } from "@/data/showcase";
import { resolveMarketingMetadata } from "@/lib/marketing-metadata";
import { STATIC_MARKETING_SLUGS } from "@/lib/marketing-path-registry";
import { MARKETING_SERVICES } from "@/lib/seo";

export const revalidate = 86400;

type PageProps = {
	params: Promise<{ path: string[] }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { path } = await params;
	return resolveMarketingMetadata(path);
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

	for (const slug of STATIC_MARKETING_SLUGS) {
		paths.push({ path: [slug] });
	}

	for (const slug of getAllServiceAreaSlugs()) {
		paths.push({ path: ["service-areas", slug] });
	}

	return paths;
}

export default async function MarketingCatchAllPage({ params }: PageProps) {
	const { path } = await params;
	if (!path?.length) notFound();
	return (
		<>
			<MarketingJsonLd path={path} />
			<MarketingSiteRouter path={path} />
		</>
	);
}
