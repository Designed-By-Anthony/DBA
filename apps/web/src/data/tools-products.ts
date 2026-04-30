/**
 * Micro-SaaS product catalog for the /tools store page.
 *
 * Stripe Payment Links are created separately in the Stripe dashboard
 * (by Viktor) and referenced here by URL. When Viktor delivers the
 * final payment-link table, drop each URL into the matching tier's
 * `monthlyLink` / `annualLink` field.
 */

export type ProductTier = {
	name: string;
	monthlyPrice: number;
	annualPrice: number;
	features: readonly string[];
	monthlyLink: string;
	annualLink: string;
	highlight?: boolean;
};

export type Product = {
	slug: string;
	name: string;
	tagline: string;
	description: string;
	icon: string;
	category: string;
	tiers: readonly ProductTier[];
};

const PLACEHOLDER_LINK = "#";

export const TOOLS_PRODUCTS: readonly Product[] = [
	{
		slug: "sitescan",
		name: "SiteScan",
		tagline: "Website Health Reports",
		description:
			"Automated performance, SEO, and accessibility audits with actionable fix-lists and branded PDF exports.",
		icon: "search",
		category: "SEO & Performance",
		tiers: [
			{
				name: "Starter",
				monthlyPrice: 19,
				annualPrice: 190,
				features: [
					"Weekly scans for 1 site",
					"Email alerts on regressions",
					"Performance score tracking",
					"Core Web Vitals history",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 39,
				annualPrice: 390,
				highlight: true,
				features: [
					"5 sites monitored",
					"Competitor comparison",
					"White-label reports",
					"SEO recommendations engine",
					"Everything in Starter",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Agency",
				monthlyPrice: 79,
				annualPrice: 790,
				features: [
					"Unlimited sites",
					"Client dashboard access",
					"Branded PDF exports",
					"API access",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
	{
		slug: "reviewpilot",
		name: "ReviewPilot",
		tagline: "AI Review Response",
		description:
			"Respond to Google, Yelp, and Facebook reviews in seconds with AI-crafted replies that sound like you.",
		icon: "bot",
		category: "Reputation",
		tiers: [
			{
				name: "Starter",
				monthlyPrice: 29,
				annualPrice: 290,
				features: [
					"1 review platform",
					"50 AI responses / month",
					"Tone & brand voice tuning",
					"One-click publish",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 49,
				annualPrice: 490,
				highlight: true,
				features: [
					"All major platforms",
					"Unlimited AI responses",
					"Sentiment dashboard",
					"Weekly digest emails",
					"Everything in Starter",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Business",
				monthlyPrice: 79,
				annualPrice: 790,
				features: [
					"Multi-location support",
					"Team access & approval flow",
					"Review request automation",
					"CRM integration",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
	{
		slug: "clienthub",
		name: "ClientHub",
		tagline: "Client Portal",
		description:
			"A branded portal for file sharing, project updates, invoicing, and scheduling — so clients never ask 'where are we?'",
		icon: "folder",
		category: "Client Management",
		tiers: [
			{
				name: "Solo",
				monthlyPrice: 29,
				annualPrice: 290,
				features: [
					"Branded portal",
					"File sharing & messaging",
					"Project status board",
					"Up to 10 clients",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 49,
				annualPrice: 490,
				highlight: true,
				features: [
					"Invoicing & payments",
					"Scheduling integration",
					"Unlimited clients",
					"Custom branding",
					"Everything in Solo",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Business",
				monthlyPrice: 79,
				annualPrice: 790,
				features: [
					"Multi-user team access",
					"Custom domain",
					"API access",
					"Priority support",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
	{
		slug: "localrank",
		name: "LocalRank",
		tagline: "Local SEO Dashboard",
		description:
			"Track keyword rankings, Google Business Profile metrics, and local pack positions across all your locations.",
		icon: "mapPin",
		category: "SEO & Performance",
		tiers: [
			{
				name: "Starter",
				monthlyPrice: 19,
				annualPrice: 190,
				features: [
					"1 location tracked",
					"Keyword rank tracking",
					"GBP metrics dashboard",
					"Monthly snapshot emails",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 39,
				annualPrice: 390,
				highlight: true,
				features: [
					"3 locations tracked",
					"Competitor alerts",
					"Automated ranking reports",
					"Citation monitoring",
					"Everything in Starter",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Business",
				monthlyPrice: 59,
				annualPrice: 590,
				features: [
					"10 locations tracked",
					"White-label reports",
					"Team access",
					"API access",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
	{
		slug: "testiflow",
		name: "TestiFlow",
		tagline: "Testimonial Collector",
		description:
			"Collect, manage, and showcase text and video testimonials with embeddable widgets that convert visitors into buyers.",
		icon: "star",
		category: "Social Proof",
		tiers: [
			{
				name: "Starter",
				monthlyPrice: 19,
				annualPrice: 190,
				features: [
					"Automated review requests",
					"1 embed widget",
					"Up to 25 testimonials",
					"Email collection flow",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 29,
				annualPrice: 290,
				highlight: true,
				features: [
					"Video testimonials",
					"Unlimited embed widgets",
					"Third-party integrations",
					"Custom branding",
					"Everything in Starter",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Business",
				monthlyPrice: 49,
				annualPrice: 490,
				features: [
					"Multi-location support",
					"White-label widgets",
					"API access",
					"Priority support",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
	{
		slug: "contentmill",
		name: "ContentMill",
		tagline: "AI Social Content",
		description:
			"Generate on-brand social posts, schedule across platforms, and track engagement — all powered by AI that knows your voice.",
		icon: "pen",
		category: "Content & Social",
		tiers: [
			{
				name: "Starter",
				monthlyPrice: 19,
				annualPrice: 190,
				features: [
					"1 brand profile",
					"30 AI posts / month",
					"3 social platforms",
					"Content calendar view",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Pro",
				monthlyPrice: 39,
				annualPrice: 390,
				highlight: true,
				features: [
					"3 brand profiles",
					"Unlimited AI posts",
					"All social platforms",
					"Smart scheduling",
					"Everything in Starter",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
			{
				name: "Business",
				monthlyPrice: 69,
				annualPrice: 690,
				features: [
					"10 brand profiles",
					"Team access & approval",
					"White-label reports",
					"Analytics dashboard",
					"Everything in Pro",
				],
				monthlyLink: PLACEHOLDER_LINK,
				annualLink: PLACEHOLDER_LINK,
			},
		],
	},
] as const;

export const PROMO_FOUNDING = {
	code: "FOUNDING50",
	label: "Founding Member",
	discount: "50% off forever",
	note: "First 20 customers per product",
} as const;

export const PROMO_BOGO = {
	code: "BOGO50",
	label: "BOGO",
	discount: "50% off your second tool",
	note: "Buy one tool, get 50% off another subscription",
} as const;
