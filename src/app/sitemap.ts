import type { MetadataRoute } from "next";
import { getMarketingSitemapPathnames } from "@/lib/marketing-path-registry";
import { SITE_URL } from "@/lib/seo";

const NOINDEX_PATH_PREFIXES = ["/thank-you", "/facebook-offer"];

function isIndexablePath(pathname: string): boolean {
	return !NOINDEX_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	return getMarketingSitemapPathnames()
		.filter(isIndexablePath)
		.map((pathname) => ({
			url: `${SITE_URL}${pathname}`,
			lastModified,
			changeFrequency:
				pathname === "/" ? ("weekly" as const) : ("monthly" as const),
			priority:
				pathname === "/" ? 1 : pathname.startsWith("/services") ? 0.9 : 0.75,
		}));
}
