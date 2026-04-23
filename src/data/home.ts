import {
	ENTERPRISE_WEBSITE_STARTING_PRICE,
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	PUBLIC_PAYMENT_STRUCTURE_COPY,
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
		answer: `Most Mohawk Valley and Central NY service-business rebuilds land in the ${STANDARD_WEBSITE_TYPICAL_RANGE} range (benchmarked against local agencies in Utica and Syracuse). Simple single-service sites still start at ${STANDARD_WEBSITE_STARTING_PRICE}. Enterprise or multi-location scopes start from ${ENTERPRISE_WEBSITE_STARTING_PRICE}. ${PUBLIC_PAYMENT_STRUCTURE_COPY} Founding-partner pilot spots pair a complimentary custom build with a ${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL} while any of the ${FOUNDING_PARTNER_BUILD_SLOTS} launch slots remain.`,
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
		answer: `Yes. Every build includes the on-page SEO work needed to rank — clean site structure, proper headings, mobile-friendly layout, and the behind-the-scenes tags Google uses to understand your business. After launch you can add the ${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL} (hosting plus ongoing local SEO and Google Business Profile care) or step up to the full Google Business Profile program for citations, reviews, posts, and ranking maps. No long contracts.`,
	},
	{
		question: "Do you only work with Mohawk Valley businesses?",
		answer:
			"Headquartered in the Mohawk Valley (Utica / Rome / Clinton / New Hartford), with active clients across Syracuse, the North Country, and greater Central New York. Service-area pages are available for each market, and remote engagements outside Upstate NY are welcome when the fit is right.",
	},
	{
		question: "What happens when I run the free audit?",
		answer:
			"You enter your website address and the scanner grades your site on speed, accessibility, best practices, and SEO in about a minute. If you want a deeper read from a human, leave your name and email and Anthony replies within one business day with the clearest fixes and whether a rebuild is actually worth it for your business (sometimes it is not).",
	},
];

export const processSteps = [
	{
		title: "Run the free audit on your site",
		description:
			"Enter your URL into our in-house Lighthouse scanner. You get performance, accessibility, best practices, and SEO scores in under 60 seconds — no signup, no waiting.",
	},
	{
		title: "Anthony reviews and follows up",
		description:
			"If you want a deeper read, Anthony reviews the results and sends a practical summary of the clearest fixes and the likely gains. If a rebuild makes sense, the quote is based on what was actually found.",
	},
	{
		title: "You see the site before it goes live",
		description: `Nothing launches until you approve it. ${PUBLIC_PAYMENT_STRUCTURE_COPY} Standard custom builds start at ${STANDARD_WEBSITE_STARTING_PRICE}, or ask about a founding partner spot while any remain (${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL}).`,
	},
];

export const homeFooterCta = {
	eyebrow: "Free Instant Audit",
	title: "Curious how your site is really doing?",
	description:
		"Paste your URL into our scanner and you will get a straight report in about a minute — speed, accessibility, best practices, and SEO. No signup, no pitch deck. If you want a human read on what it means, I am here.",
	primaryHref: "/free-seo-audit",
	primaryLabel: "Run the Free Audit",
	secondaryHref: "https://calendly.com/anthony-designedbyanthony/web-design-consult",
	secondaryLabel: "Book a 15-minute intro call",
	note: "Results are instant. A reply from me is a business day if you ask for one.",
};
