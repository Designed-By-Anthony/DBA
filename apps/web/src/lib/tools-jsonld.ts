import { TOOLS_PRODUCTS } from "@/data/tools-products";
import { SITE_URL } from "@/lib/seo";

/** ItemList of Micro-SaaS tools on /tools for SoftwareApplication-style discovery. */
export function buildToolsStoreJsonLd(): Record<string, unknown> {
	const url = `${SITE_URL}/tools`;
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		"@id": `${url}#tools-catalog`,
		name: "ANTHONY. Micro-SaaS Tools",
		description:
			"Purpose-built tools for local service businesses — SEO monitoring, review response, client portals, and more.",
		numberOfItems: TOOLS_PRODUCTS.length,
		itemListElement: TOOLS_PRODUCTS.map((p, i) => ({
			"@type": "ListItem",
			position: i + 1,
			item: {
				"@type": ["SoftwareApplication", "WebApplication"],
				name: p.name,
				description: p.description,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				url: `${url}#${p.slug}`,
				offers: p.tiers.map((t) => ({
					"@type": "Offer",
					name: `${p.name} — ${t.name}`,
					price: t.monthlyPrice,
					priceCurrency: "USD",
					availability: "https://schema.org/InStock",
				})),
			},
		})),
	};
}
