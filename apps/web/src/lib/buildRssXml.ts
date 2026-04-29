const SITE = "https://designedbyanthony.com";

function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function buildRssFeed(input: {
	title: string;
	description: string;
	items: { title: string; path: string; description: string; pubDate: Date }[];
}): string {
	const itemsXml = input.items
		.map(
			(item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(new URL(item.path, SITE).href)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`,
		)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${SITE}</link>
    <description>${escapeXml(input.description)}</description>
    <language>en-us</language>${itemsXml}
  </channel>
</rss>`;
}
