import { releases } from "@/data/releases";
import { buildRssFeed } from "@/lib/buildRssXml";

export async function GET() {
	const sorted = [...releases].sort(
		(a, b) =>
			new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime(),
	);
	const xml = buildRssFeed({
		title: "ANTHONY. — New Releases",
		description:
			"New client launches, case studies, and public work from ANTHONY.",
		items: sorted.map((release) => ({
			title: release.title,
			path: release.url,
			description: release.excerpt,
			pubDate: new Date(release.publishedTime),
		})),
	});
	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
