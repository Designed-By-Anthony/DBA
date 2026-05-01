import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFooterCta } from "@/data/home";
import {
	COMPARE_COMPETITORS,
	getCompareCompetitor,
} from "@/data/compare-competitors";
import { btnOutline, btnPrimary } from "@/design-system/buttons";

export const revalidate = 86400;

export function generateStaticParams(): { competitor: string }[] {
	return COMPARE_COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
	const { competitor } = await params;
	const row = getCompareCompetitor(competitor);
	if (!row) return { title: "Not found" };
	const title = `ANTHONY. vs ${row.name} | Digital Infrastructure`;
	const description = row.summary;
	return {
		title,
		description,
		alternates: { canonical: `/compare/${row.slug}` },
		openGraph: {
			title,
			description,
			url: `https://designedbyanthony.com/compare/${row.slug}`,
			type: "article",
		},
	};
}

export default async function ComparePage({
	params,
}: {
	params: Promise<{ competitor: string }>;
}) {
	const { competitor } = await params;
	const row = getCompareCompetitor(competitor);
	if (!row) notFound();

	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<section className="section-shell section-shell--wash marketing-page-hero">
				<div className="section-container max-w-[48rem]">
					<p className="text-[0.72rem] font-[family-name:var(--font-inter)] uppercase tracking-[0.22em] text-[rgb(var(--accent-bronze-rgb))] mb-3">
						Compare
					</p>
					<h1 className="page-title">
						ANTHONY. vs {row.name}
					</h1>
					<p className="page-lead mt-3">{row.tagline}</p>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container marketing-prose max-w-[42rem]">
					<p>{row.summary}</p>
					<p>
						This route is a scaffold for long-form comparison tables, objection
						handling, and FAQ schema — publish deeper sections as your paid search
						and SEO experiments dictate.
					</p>
					<div className="flex flex-wrap gap-4 mt-8 not-prose">
						<Link href="/contact" className={btnPrimary}>
							Let&apos;s build something great.
						</Link>
						<Link href="/lighthouse" className={btnOutline}>
							Audit My Site
						</Link>
					</div>
				</div>
			</section>
		</MarketingChrome>
	);
}
