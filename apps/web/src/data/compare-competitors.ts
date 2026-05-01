export type CompareCompetitor = {
	slug: string;
	name: string;
	tagline: string;
	summary: string;
};

/** Scaffold list — expand with full comparison tables + FAQs over time. */
export const COMPARE_COMPETITORS: readonly CompareCompetitor[] = [
	{
		slug: "wordpress",
		name: "WordPress",
		tagline: "Plugin stacks vs engineered estates",
		summary:
			"WordPress can work — until themes, builders, and plugins stack latency and security debt. ANTHONY. ships lean Next.js surfaces with schema-first SEO and Vault-native lead routing.",
	},
	{
		slug: "wix",
		name: "Wix",
		tagline: "Template ceilings vs bespoke infrastructure",
		summary:
			"Wix optimizes for speed-to-publish, not speed-to-load or differentiation in competitive local SERPs. We trade templates for hand-built IA, performance budgets, and CRM-connected conversion paths.",
	},
	{
		slug: "squarespace",
		name: "Squarespace",
		tagline: "Editor simplicity vs industrial-grade SEO",
		summary:
			"Squarespace keeps layouts approachable but constrains technical SEO depth and integrations. ANTHONY. pairs structured data, programmatic landing scale, and API-first tooling.",
	},
	{
		slug: "webflow",
		name: "Webflow",
		tagline: "Designer-led builds vs founder-led systems",
		summary:
			"Webflow excels at visual iteration; ANTHONY. focuses on durable pipelines — edge deployment, Elysia APIs, D1-backed ledger, and Vault workflows tied to your growth plan.",
	},
] as const;

export function getCompareCompetitor(slug: string): CompareCompetitor | undefined {
	return COMPARE_COMPETITORS.find((c) => c.slug === slug);
}
