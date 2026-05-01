import {
	ENTERPRISE_WEBSITE_STARTING_PRICE,
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	PUBLIC_LAUNCH_BUNDLE_COPY,
	PUBLIC_STANDARD_PAYMENT_PLAN,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";

export const whyStackCards = [
	{
		tech: "Fast on a phone",
		plain: "Your pages open almost the moment a customer taps.",
		why: "When your site feels instant on a phone, fewer people bounce, more people call, and Google ranks you higher — especially when someone is searching from a job site, a driveway, or the front desk.",
	},
	{
		tech: "Built for Google",
		plain: "Google grades websites. We build to the top of that report card.",
		why: "Google already runs a free test that scores every website on speed, accessibility, and SEO. Every site we ship is tuned for that test from day one — so when someone searches for what you do, you are not fighting your own site to get seen.",
	},
	{
		tech: "Less to break after launch",
		plain: "No plugin maze. No weekly updates. No hacks.",
		why: "Most small-business websites slow down or break because of dozens of plugins drifting out of date. Ours are built to stay quiet: fewer moving parts, almost nothing to maintain, and a lot harder for anyone to hack.",
	},
];

export const homeFaqEntries = [
	{
		question: "How much does a custom website cost in the Mohawk Valley?",
		answer: `Most Mohawk Valley and Central NY service-business rebuilds land in the ${STANDARD_WEBSITE_TYPICAL_RANGE} total band for a typical 5–10 page site. ${PUBLIC_STANDARD_PAYMENT_PLAN} ${PUBLIC_LAUNCH_BUNDLE_COPY} Simple single-service sites still start at ${STANDARD_WEBSITE_STARTING_PRICE}. Enterprise or multi-location scopes start from ${ENTERPRISE_WEBSITE_STARTING_PRICE}. Founding-partner pilot spots pair a complimentary custom build with a ${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL} while any of the ${FOUNDING_PARTNER_BUILD_SLOTS} launch slots remain.`,
	},
	{
		question: "How long does it take to build a service-business website?",
		answer:
			"Most service-business websites ship in two to four weeks once scope and content are confirmed. Website rescues and single-service landing pages can be faster; multi-location or integration-heavy builds take longer. You see the timeline in writing before any work starts, and nothing launches until you approve it.",
	},
	{
		question: "Why not just use WordPress or Wix?",
		answer:
			"Our sites are built on a leaner, faster stack than WordPress or Wix. Pages open almost instantly on a phone, score at the top of Google’s own website report card by default, and there is no plugin maze to keep patched every week. For a local service business, that means fewer bounced visitors, better Google placement, and fewer things that can break between you and a new customer. We go deeper on the tech on the Our Edge page if you want the full story.",
	},
	{
		question: "Do you handle local SEO and Google Business Profile too?",
		answer: `Yes. Every build includes the on-page SEO work needed to rank — clean site structure, proper headings, mobile-friendly layout, and the behind-the-scenes tags Google uses to understand your business. On a standard rebuild, the first three months of hosting, security, and core local SEO are included while we own the stack with you; after that window you can roll into the ${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL} for ongoing care, or step up to the full Google Business Profile program for citations, reviews, posts, and ranking maps. No long contracts.`,
	},
	{
		question: "Do you only work with Mohawk Valley businesses?",
		answer:
			"Headquartered in the Mohawk Valley (Utica / Rome / Clinton / New Hartford), with active clients across Syracuse, the North Country, and greater Central New York. Service-area pages are available for each market, and remote engagements outside Upstate NY are welcome when the fit is right.",
	},
	{
		question: "What happens when I request the free audit?",
		answer:
			"You share your website address and Anthony runs a manual review grading your site on speed, accessibility, best practices, and SEO. He replies within one business day with the clearest fixes and whether a rebuild is actually worth it for your business (sometimes it is not).",
	},
	{
		question: "Do I actually own my website when it is done?",
		answer: `Yes — the source code, design assets, and content are yours. We hand over everything at launch. Most agencies keep the code hostage and your site disappears the moment you stop paying. Here, the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL} covers hosting, security, and ongoing SEO — not permission to keep your own site online. If you ever leave, you take your site with you.`,
	},
];

export const processSteps = [
	{
		title: "Contact us for your free audit",
		description:
			"Send us your URL. You get a manual review of performance, accessibility, best practices, and SEO — no pitch deck, no commitment.",
	},
	{
		title: "Anthony reviews and follows up",
		description:
			"Anthony reviews your site and sends a practical summary of the clearest fixes and the likely gains. If a rebuild makes sense, the quote is based on what was actually found.",
	},
	{
		title: "You see the site before it goes live",
		description: `Nothing launches until you approve it. ${PUBLIC_STANDARD_PAYMENT_PLAN} Standard custom builds start at ${STANDARD_WEBSITE_STARTING_PRICE}, or ask about a founding partner spot while any remain (${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL}).`,
	},
];

export const homeFooterCta = {
	eyebrow: "Free site audit",
	title: "Curious how your site is really doing?",
	description:
		"Drop your URL and you'll get a straight report — Core Web Vitals, on-page SEO, crawl checks, and an AI-prioritized fix list. No signup, no pitch deck.",
	primaryHref: "/lighthouse",
	primaryLabel: "Let's build something great.",
	secondaryHref: "/contact",
	secondaryLabel: "Or open the contact form",
	note: "A reply from Anthony usually comes within one business day.",
};
