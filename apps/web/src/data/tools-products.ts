/**
 * Micro-SaaS product catalog for the /tools store page.
 *
 * Stripe Payment Links are live — each tier references its checkout URL
 * from the STRIPE_LINKS map below.
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

/* ── Stripe Payment Links (live — created by Viktor, wired 2026-04-30) ── */
const STRIPE_LINKS = {
	sitescan: {
		starter: {
			monthly: "https://buy.stripe.com/14A4gz4lOg8y5bx0uP7ss00",
			annual: "https://buy.stripe.com/9B600j8C4f4ucDZgtN7ss01",
		},
		pro: {
			monthly: "https://buy.stripe.com/6oU6oH7y03lM0Vha5p7ss02",
			annual: "https://buy.stripe.com/eVqdR9cSk1dE1Zla5p7ss03",
		},
		agency: {
			monthly: "https://buy.stripe.com/14AeVd7y0f4u0Vh1yT7ss04",
			annual: "https://buy.stripe.com/dRmfZh8C4g8yavR5P97ss05",
		},
	},
	reviewpilot: {
		starter: {
			monthly: "https://buy.stripe.com/5kQaEXcSk09A33p3H17ss06",
			annual: "https://buy.stripe.com/8x23cv7y0f4ueM7b9t7ss07",
		},
		pro: {
			monthly: "https://buy.stripe.com/9B67sL8C4cWmfQb4L57ss08",
			annual: "https://buy.stripe.com/6oU5kD8C44pQcDZelF7ss09",
		},
		business: {
			monthly: "https://buy.stripe.com/4gM3cvf0s5tU6fB91l7ss0b",
			annual: "https://buy.stripe.com/6oU7sL2dG09A47t6Td7ss0a",
		},
	},
	clienthub: {
		solo: {
			monthly: "https://buy.stripe.com/00w4gz2dGbSi7jFa5p7ss0c",
			annual: "https://buy.stripe.com/cNi4gz2dGg8yfQb7Xh7ss0d",
		},
		pro: {
			monthly: "https://buy.stripe.com/bJe14n05y7C2bzV5P97ss0e",
			annual: "https://buy.stripe.com/aFa9ATcSke0q7jF7Xh7ss0f",
		},
		business: {
			monthly: "https://buy.stripe.com/3cI28r19C9Ka33p0uP7ss0g",
			annual: "https://buy.stripe.com/00w3cvbOg1dEgUf7Xh7ss0h",
		},
	},
	localrank: {
		starter: {
			monthly: "https://buy.stripe.com/aFa14ng4w8G61Zl7Xh7ss0i",
			annual: "https://buy.stripe.com/7sY4gz5pS2hI9rNelF7ss0j",
		},
		pro: {
			monthly: "https://buy.stripe.com/dRm28r3hK8G647ta5p7ss0k",
			annual: "https://buy.stripe.com/3cI4gz7y009A6fB4L57ss0l",
		},
		business: {
			monthly: "https://buy.stripe.com/14A14n8C44pQ1Zl1yT7ss0m",
			annual: "https://buy.stripe.com/28EfZhaKc9KabzV6Td7ss0n",
		},
	},
	testiflow: {
		starter: {
			monthly: "https://buy.stripe.com/9B614n19C5tU6fB0uP7ss0o",
			annual: "https://buy.stripe.com/00w9AT2dG6xY33pb9t7ss0p",
		},
		pro: {
			monthly: "https://buy.stripe.com/3cI5kD8C46xY7jF2CX7ss0r",
			annual: "https://buy.stripe.com/14A9ATdWog8y0Vh5P97ss0q",
		},
		business: {
			monthly: "https://buy.stripe.com/5kQ6oHg4wf4u33pelF7ss0s",
			annual: "https://buy.stripe.com/7sYbJ1cSkf4u7jF1yT7ss0t",
		},
	},
	contentmill: {
		starter: {
			monthly: "https://buy.stripe.com/14A5kD7y0aOe5bxfpJ7ss0u",
			annual: "https://buy.stripe.com/00wbJ119CaOe33p5P97ss0v",
		},
		pro: {
			monthly: "https://buy.stripe.com/eVq14ndWof4u0Vh5P97ss0w",
			annual: "https://buy.stripe.com/4gM9AT6tW4pQbzV1yT7ss0x",
		},
		business: {
			monthly: "https://buy.stripe.com/28E28r3hK2hI47t4L57ss0y",
			annual: "https://buy.stripe.com/9B67sLg4w09A33pgtN7ss0z",
		},
	},
} as const;

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
				monthlyLink: STRIPE_LINKS.sitescan.starter.monthly,
				annualLink: STRIPE_LINKS.sitescan.starter.annual,
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
				monthlyLink: STRIPE_LINKS.sitescan.pro.monthly,
				annualLink: STRIPE_LINKS.sitescan.pro.annual,
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
				monthlyLink: STRIPE_LINKS.sitescan.agency.monthly,
				annualLink: STRIPE_LINKS.sitescan.agency.annual,
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
				monthlyLink: STRIPE_LINKS.reviewpilot.starter.monthly,
				annualLink: STRIPE_LINKS.reviewpilot.starter.annual,
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
				monthlyLink: STRIPE_LINKS.reviewpilot.pro.monthly,
				annualLink: STRIPE_LINKS.reviewpilot.pro.annual,
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
				monthlyLink: STRIPE_LINKS.reviewpilot.business.monthly,
				annualLink: STRIPE_LINKS.reviewpilot.business.annual,
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
				monthlyLink: STRIPE_LINKS.clienthub.solo.monthly,
				annualLink: STRIPE_LINKS.clienthub.solo.annual,
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
				monthlyLink: STRIPE_LINKS.clienthub.pro.monthly,
				annualLink: STRIPE_LINKS.clienthub.pro.annual,
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
				monthlyLink: STRIPE_LINKS.clienthub.business.monthly,
				annualLink: STRIPE_LINKS.clienthub.business.annual,
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
				monthlyLink: STRIPE_LINKS.localrank.starter.monthly,
				annualLink: STRIPE_LINKS.localrank.starter.annual,
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
				monthlyLink: STRIPE_LINKS.localrank.pro.monthly,
				annualLink: STRIPE_LINKS.localrank.pro.annual,
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
				monthlyLink: STRIPE_LINKS.localrank.business.monthly,
				annualLink: STRIPE_LINKS.localrank.business.annual,
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
				monthlyLink: STRIPE_LINKS.testiflow.starter.monthly,
				annualLink: STRIPE_LINKS.testiflow.starter.annual,
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
				monthlyLink: STRIPE_LINKS.testiflow.pro.monthly,
				annualLink: STRIPE_LINKS.testiflow.pro.annual,
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
				monthlyLink: STRIPE_LINKS.testiflow.business.monthly,
				annualLink: STRIPE_LINKS.testiflow.business.annual,
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
				monthlyLink: STRIPE_LINKS.contentmill.starter.monthly,
				annualLink: STRIPE_LINKS.contentmill.starter.annual,
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
				monthlyLink: STRIPE_LINKS.contentmill.pro.monthly,
				annualLink: STRIPE_LINKS.contentmill.pro.annual,
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
				monthlyLink: STRIPE_LINKS.contentmill.business.monthly,
				annualLink: STRIPE_LINKS.contentmill.business.annual,
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
