import { blogPosts } from "@/data/blogPosts";
import { buildRssFeed } from "@/lib/buildRssXml";

export async function GET() {
	const sorted = [...blogPosts].sort(
		(a, b) =>
			new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime(),
	);
	const xml = buildRssFeed({
		title: "ANTHONY. — Web Design for Service Businesses",
		description:
			"Practical articles on web design, local SEO, site speed, and what actually gets service businesses more phone calls.",
		items: sorted.map((post) => ({
			title: post.title,
			path: post.url,
			description: post.excerpt,
			pubDate: new Date(post.publishedTime),
		})),
	});
	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
