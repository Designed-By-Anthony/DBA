import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { releases } from "../data/releases";

const sortedReleases = [...releases].sort(
	(a, b) =>
		new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime(),
);

export async function GET(context: APIContext) {
	return rss({
		title: "Designed by Anthony — New Releases",
		description:
			"New client launches, case studies, and public work from Designed by Anthony.",
		site: context.site ?? "https://designedbyanthony.com",
		items: sortedReleases.map((release) => ({
			title: release.title,
			link: release.url,
			description: release.excerpt,
			pubDate: new Date(release.publishedTime),
		})),
		customData: `<language>en-us</language>`,
	});
}
