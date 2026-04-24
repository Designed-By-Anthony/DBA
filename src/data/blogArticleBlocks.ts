/**
 * Long-form article bodies for blog posts (slug = last segment of `blogPosts[].url`).
 * Posts without an entry here still render excerpt + hero; add blocks over time.
 */

export type ArticleBlock =
	| { type: "p"; text: string }
	| { type: "h2"; text: string }
	| { type: "h3"; text: string }
	| { type: "ul"; items: string[] }
	| { type: "blockquote"; text: string };

const upstateNyLocalSeo2026: ArticleBlock[] = [
	{
		type: "p",
		text: "If you run a plumbing, HVAC, landscaping, electrical, or remodeling company between Albany and Buffalo, you already know the truth: the phone rings when Google thinks you are the obvious answer for the neighborhood someone is standing in. The hard part is earning that position without a Manhattan-sized marketing budget.",
	},
	{
		type: "h2",
		text: "Why Upstate behaves differently from NYC search",
	},
	{
		type: "p",
		text: "Upstate cities are smaller, distances are longer, and intent is often hyper-local: “near me,” a village name, or a county people actually say out loud. That rewards clear service pages, honest service areas, and websites that load fast on mid-tier phones on LTE — not generic “we serve the USA” copy.",
	},
	{
		type: "h2",
		text: "The Map Pack still runs the first click",
	},
	{
		type: "p",
		text: "For emergency and high-intent trades, Google Business Profile (GBP) visibility is still the front door. Your website’s job is to back up the profile: consistent business name, categories that match reality, photos that look like your trucks and crews, and pages that answer the questions people ask after they tap Directions.",
	},
	{
		type: "ul",
		items: [
			"Align GBP categories with the services you want to be known for — not every add-on you ever tried once.",
			"Publish proof: projects, permits-level detail where appropriate, and short case blurbs with neighborhood names.",
			"Keep NAP consistent everywhere it appears: footer, contact page, schema, and citations.",
		],
	},
	{
		type: "h2",
		text: "On-site SEO that actually moves the needle",
	},
	{
		type: "p",
		text: "Thin “city + service” doorway pages are easy to spot and easy to ignore. Strong pages have unique copy, real headings, internal links that help humans browse, and structured data that matches what is visible on the page — not keyword stuffing hidden in JSON-LD.",
	},
	{
		type: "blockquote",
		text: "Google does not rank websites. It ranks the best available answer for a searcher’s moment. Your site should read like you understand that moment.",
	},
	{
		type: "h2",
		text: "Technical hygiene is a tiebreaker that becomes a win",
	},
	{
		type: "p",
		text: "Core Web Vitals are not vanity metrics for contractors. They correlate with whether someone waits for your form to load, whether click-to-call works under stress, and whether Google trusts the page enough to show it above a competitor who bought a template bundle last Tuesday.",
	},
	{
		type: "h3",
		text: "What to fix first (practical order)",
	},
	{
		type: "ul",
		items: [
			"Mobile Largest Contentful Paint and layout stability on your homepage and top money pages.",
			"Compress hero photography; lazy-load below-the-fold galleries.",
			"Forms that work with one thumb, with clear error states and a human confirmation path.",
		],
	},
	{
		type: "h2",
		text: "When to layer paid, listings, and review velocity",
	},
	{
		type: "p",
		text: "Local service businesses win when organic, reputation, and light paid retargeting tell the same story. If ads send traffic to a slow page with a buried phone number, you are renting attention and burning it. Fix the landing experience, then scale.",
	},
	{
		type: "p",
		text: "If you want a second opinion on where you stand, run the free audit on this site and send the URL you care about most — Anthony reviews the stack, the on-page structure, and the GBP alignment, then replies with a blunt next step.",
	},
];

const websiteCost2026: ArticleBlock[] = [
	{
		type: "p",
		text: "Small-business owners are told two lies at the same time: that a website should cost almost nothing, and that a “real” agency build should cost as much as a used truck. The honest answer is a range — and the driver is risk: how much revenue is tied to the site, how complex the integrations are, and how much editorial work is already finished before code starts.",
	},
	{
		type: "h2",
		text: "What you are actually buying",
	},
	{
		type: "ul",
		items: [
			"Discovery and information architecture (what pages exist, what each page must accomplish).",
			"Design and copy placement tuned for mobile-first reading and calls.",
			"Engineering: performance budget, accessibility, analytics wiring, forms, and launch hardening.",
			"Training so you can update what should be yours — without opening a ticket for a typo.",
		],
	},
	{
		type: "h2",
		text: "Where DIY and cheap templates fall apart",
	},
	{
		type: "p",
		text: "Templates are fine until they are not: when you need unique service-area logic, schema that matches your real business type, or a page speed budget that survives real photography and a few third-party embeds. The hidden cost is always the same — lost leads you never see because the bounce happened in ten seconds.",
	},
	{
		type: "h2",
		text: "How to compare quotes apples-to-apples",
	},
	{
		type: "p",
		text: "Ask for the page list, the performance target, who writes first-draft copy, what happens after launch, and what “done” means in writing. If two proposals disagree wildly, the difference is usually scope — not magic.",
	},
];

const freeLighthouseAuditUtica: ArticleBlock[] = [
	{
		type: "p",
		text: "A Lighthouse audit is not a personality test for your website. It is a structured snapshot: performance, accessibility, best practices, and SEO signals Chrome can measure in a lab run. For local service businesses in Utica, Rome, Syracuse, and the surrounding towns, that snapshot is useful because it catches the boring failures that quietly kill calls.",
	},
	{
		type: "h2",
		text: "What the audit is good at (and what it is not)",
	},
	{
		type: "ul",
		items: [
			"Good at: oversized images, render-blocking patterns, obvious accessibility gaps, and broken fundamentals.",
			"Not a substitute for: GBP strategy, review cadence, competitive SERP analysis, or copy that proves you are the right crew for the job.",
		],
	},
	{
		type: "h2",
		text: "How to use a 60-second run without fooling yourself",
	},
	{
		type: "p",
		text: "Run the audit on the pages that actually make money: homepage, top service pages, and your contact/quote flow. If the score is “fine” but real humans still bounce, the problem is usually clarity and trust — not milliseconds. Fix the obvious technical debt first, then tighten the story above the fold.",
	},
	{
		type: "blockquote",
		text: "Speed buys you a fair hearing. Copy and proof win the call.",
	},
	{
		type: "p",
		text: "Use the free audit tool on this site, keep the URL you tested, and if you want Anthony to interpret the results in plain English, submit it through the contact path — you will get a human reply, not an auto-spam sequence.",
	},
];

const whyMonthlySeo: ArticleBlock[] = [
	{
		type: "p",
		text: "Local SEO is not a one-time launch task. Competitors add pages, Google updates layouts, reviews shift the trust picture, and your own services evolve. Monthly work keeps the site, the profile, and the measurement loop aligned with what you are actually selling this quarter.",
	},
	{
		type: "h2",
		text: "What “monthly” should include (and what is noise)",
	},
	{
		type: "ul",
		items: [
			"Search Console and ranking snapshots tied to specific service pages — not vanity keyword counts.",
			"GBP hygiene: categories, services, photos, posts, and Q&A patterns that match real customer questions.",
			"Content fixes: thin pages, broken internal links, and outdated offers that no longer match your trucks or crews.",
		],
	},
	{
		type: "p",
		text: "Directory blitzes without a strategy usually waste budget. Directories matter when they improve discovery in the places your customers actually search — not when a spreadsheet says you need 400 citations.",
	},
];

const contractorMistakes: ArticleBlock[] = [
	{
		type: "p",
		text: "Most contractor sites fail for boring reasons: the phone number is hard to tap, the service list is a wall of jargon, and the proof section is empty. The fixes are not glamorous — they are disciplined.",
	},
	{
		type: "h2",
		text: "Five mistakes we see on almost every audit",
	},
	{
		type: "ul",
		items: [
			"Homepage hero talks about “quality” instead of the exact jobs you want next week.",
			"Service pages duplicate the same paragraph with a different city name swapped in.",
			"Photos are stock images of strangers in hard hats — not your trucks, your crew, your finished work.",
			"Forms route into an inbox black hole with no auto-reply and no backup SMS path.",
			"Mobile layout breaks at the exact width your customers use on job sites.",
		],
	},
	{
		type: "blockquote",
		text: "Trust is built from specificity. Specific towns, specific photos, specific guarantees.",
	},
];

const mobileFirstSeo: ArticleBlock[] = [
	{
		type: "p",
		text: "Google indexes your mobile experience first. That means your mobile page is not a “lite” version of your desktop story — it is the canonical experience for both users and crawlers.",
	},
	{
		type: "h2",
		text: "Speed is a conversion problem before it is an SEO problem",
	},
	{
		type: "p",
		text: "If a homeowner taps a Google ad or a Maps result and your hero image takes three seconds to decode, you lose the call to the next company whose site opens like a book.",
	},
	{
		type: "ul",
		items: [
			"Resize and compress photography; do not ship print-resolution assets to phones.",
			"Defer non-critical scripts; keep above-the-fold clean.",
			"Test forms on real devices, not only desktop Chrome.",
		],
	},
];

const localBusinessSchema: ArticleBlock[] = [
	{
		type: "p",
		text: "LocalBusiness schema is not a magic ranking button. It is a structured way to confirm what you already show humans: who you are, where you operate, and how to reach you.",
	},
	{
		type: "h2",
		text: "When schema helps",
	},
	{
		type: "p",
		text: "Schema helps when it matches visible content, reinforces entity signals across pages, and reduces ambiguity for Google when two businesses share similar names in the same region.",
	},
	{
		type: "h2",
		text: "When schema hurts",
	},
	{
		type: "p",
		text: "If your JSON-LD claims services you do not list on the site, or uses addresses you do not publish, you are training search engines to distrust the rest of your signals.",
	},
];

const siteSpeedConversion: ArticleBlock[] = [
	{
		type: "p",
		text: "Speed is not an abstract Lighthouse trophy. It is the difference between someone requesting a quote and someone bouncing because the form never became interactive.",
	},
	{
		type: "h2",
		text: "Measure the right pages",
	},
	{
		type: "p",
		text: "Benchmark the pages that earn money: homepage, top services, and the contact path. A fast blog template does not save a slow booking flow.",
	},
];

const seasonalSeo: ArticleBlock[] = [
	{
		type: "p",
		text: "Seasonal businesses in Central New York (landscaping, snow, pools, outdoor living) live in bursts. SEO should plan for the ramp before the season starts — not the week the phones should already be ringing.",
	},
	{
		type: "h2",
		text: "A simple seasonal playbook",
	},
	{
		type: "ul",
		items: [
			"Pre-season: refresh service pages, publish proof from last year, and tighten GBP categories.",
			"In-season: capture review velocity and answer the questions people ask in Q&A.",
			"Post-season: consolidate learnings into evergreen guides so next year starts warmer.",
		],
	},
];

const astroTechStack: ArticleBlock[] = [
	{
		type: "p",
		text: "This site originally shipped on Astro because it is an excellent static publishing engine for marketing pages. As the product surface grew — dynamic chat, richer client tooling, and tighter Vercel integration — the marketing shell moved to Next.js App Router while keeping the same design language and performance discipline.",
	},
	{
		type: "h2",
		text: "What stays the same after the move",
	},
	{
		type: "ul",
		items: [
			"Mobile-first layouts, strict performance budgets, and honest service copy.",
			"Security headers and CSP synced from a single build step.",
			"A bias toward less JavaScript on content pages — interactivity only where it earns its keep.",
		],
	},
];

/** Slug → blocks. Keys are the final path segment (e.g. `website-cost`). */
export const BLOG_ARTICLE_BLOCKS: Record<string, ArticleBlock[]> = {
	"upstate-ny-local-seo-service-businesses-2026": upstateNyLocalSeo2026,
	"website-cost": websiteCost2026,
	"free-lighthouse-audit-utica-ny": freeLighthouseAuditUtica,
	"why-monthly-seo-matters": whyMonthlySeo,
	"contractor-website-mistakes": contractorMistakes,
	"mobile-first-seo": mobileFirstSeo,
	"local-business-schema": localBusinessSchema,
	"site-speed-conversion": siteSpeedConversion,
	"seasonal-business-seo": seasonalSeo,
	"astro-tech-stack": astroTechStack,
};

export function getArticleBlocksForSlug(slug: string): ArticleBlock[] | undefined {
	return BLOG_ARTICLE_BLOCKS[slug];
}
