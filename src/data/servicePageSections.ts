/** Extra sections for `/services/[slug]` — core title/description stay in `MARKETING_SERVICES`. */

export type ServiceExtraSection = {
	heading: string;
	paragraphs: string[];
	bullets?: string[];
};

export const SERVICE_PAGE_EXTRA_SECTIONS: Record<
	string,
	ServiceExtraSection[]
> = {
	"custom-web-design": [
		{
			heading: "What you get",
			paragraphs: [
				"A mobile-first layout system, typography tuned for readability, and components built so your team can update services and photos without breaking the layout.",
			],
			bullets: [
				"Performance budget and image pipeline suited to real job-site photography.",
				"Clear primary CTA paths: call, text, short form, and booking where appropriate.",
				"Technical SEO structure: metadata, Open Graph, and JSON-LD aligned with your real business entity.",
			],
		},
		{
			heading: "Who it is for",
			paragraphs: [
				"Service businesses that win on trust and clarity: contractors, home services, medspas, salons, and boutique retail with a story worth telling.",
			],
		},
	],
	"local-seo": [
		{
			heading: "What moves the needle",
			paragraphs: [
				"Local SEO is not a plugin. It is alignment between your website, your Google Business Profile, and the neighborhoods you actually serve.",
			],
			bullets: [
				"Service page depth that matches searcher intent (not duplicate city spam).",
				"Entity-consistent schema and crawlable internal links.",
				"Measurement: Search Console, call tracking where appropriate, and monthly priorities you can understand.",
			],
		},
	],
	"website-rescue": [
		{
			heading: "When a rescue makes sense",
			paragraphs: [
				"If your current site is slow on phones, your forms fail intermittently, or your content is trapped in a builder you have outgrown, a rescue rebuild can be faster than incremental patching.",
			],
			bullets: [
				"Inventory what must migrate (URLs, forms, tracking, embeds).",
				"Ship a modern front end without losing the rankings you still have.",
				"Give you an editor path you can live with for the next few years.",
			],
		},
	],
	"managed-hosting": [
		{
			heading: "VIP support, quietly",
			paragraphs: [
				"Managed hosting here means updates, backups, uptime monitoring, and a direct line when something looks off — not a ticket roulette.",
			],
		},
	],
	"google-business-profile": [
		{
			heading: "GBP as a system",
			paragraphs: [
				"Reviews, photos, services, Q&A, and posts should reinforce the same story your website tells. We align categories, landing pages, and reporting so you can see what changed and why.",
			],
		},
	],
	"workspace-setup": [
		{
			heading: "Professional email without the headache",
			paragraphs: [
				"Google Workspace setup for small teams: domains, groups, aliases, and guardrails so your crew can collaborate without exposing the business to avoidable mistakes.",
			],
		},
	],
	"ai-automation": [
		{
			heading: "Automation that respects your brand",
			paragraphs: [
				"Practical chat and form flows that qualify leads, route inquiries, and reduce repetitive follow-up — without sounding like a generic bot.",
			],
		},
	],
};
