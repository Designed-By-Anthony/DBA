import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { blogPosts } from "../data/blogPosts";

const sortedBlogPosts = [...blogPosts].sort(
	(a, b) =>
		new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime(),
);

export async function GET(context: APIContext) {
	return rss({
		title: "Designed by Anthony — Web Design for Service Businesses",
		description:
			"Practical articles on web design, local SEO, site speed, and what actually gets service businesses more phone calls.",
		site: context.site ?? "https://designedbyanthony.com",
		items: sortedBlogPosts.map((post) => ({
			title: post.title,
			link: post.url,
			description: post.excerpt,
			pubDate: new Date(post.publishedTime),
		})),
		customData: `<language>en-us</language>`,
	});
}
