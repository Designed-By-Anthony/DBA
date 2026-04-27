/**
 * Long-form article bodies for blog posts (slug = last segment of `blogPosts[].url`).
 * Posts without an entry here still render excerpt + hero; add blocks over time.
 */

export type ArticleBlock =
	| { type: "p"; text: string }
	| { type: "h2"; text: string }
	| { type: "h3"; text: string }
	| { type: "h4"; text: string }
	| { type: "h5"; text: string }
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
		text: "When you have numbers from any audit run, keep the URL you tested. If you want Anthony to interpret the results in plain English, reach out through the contact page — you will get a human reply, not an auto-spam sequence.",
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

const googleBusinessProfile2026CnyPlaybook: ArticleBlock[] = [
	{
		type: "p",
		text: "If you run a plumbing, HVAC, electrical, or general home-service business anywhere along the I-90 corridor — Utica, Rome, Syracuse, Auburn, Oswego, and the smaller towns Google still treats as distinct pockets of intent — your Google Business Profile (GBP) is often the first branded surface a customer sees. In 2026, Google is not only comparing star averages. It is comparing who looks operationally alive: call behavior, recency of photos and posts, visual proof of real trucks and crews, and whether conversational surfaces like Ask Maps can stitch together a coherent story from your profile, your reviews, and your website. This playbook is written for Central New York (CNY) contractors who want practical Google Maps SEO and local SEO habits that survive the next round of product changes — not a checklist that expired when Q&A was the only lever on the profile.",
	},
	{
		type: "h2",
		text: "Why Google Business Profile still wins for CNY service businesses",
	},
	{
		type: "p",
		text: "Commercial intent for trades still clusters around high-urgency searches: burst pipe, no heat, panel arcing, AC blowing warm on the first 85-degree day. Those queries surface the Map Pack first on phones, and the profile card answers the silent question: “Will someone answer, and how fast?” In Utica and Rome, smaller populations mean fewer dominant brands — so a disciplined GBP can move the needle faster than in a hyper-competitive metro, as long as your categories, service area, and proof match reality. Syracuse behaves more like a regional hub: more competitors, more filter taps, and less patience for vague service lists. Treat GBP as the public operations dashboard it has become, not a static Yellow Pages listing.",
	},
	{
		type: "p",
		text: "From an SEO perspective, your profile should echo the same entities and phrases you use on your website: city names you actually serve, service names you actually sell, and the same spelling of your business name everywhere. When Google’s systems reconcile entities across Maps, Search, and AI summaries, inconsistency reads as risk — and risk gets demoted behind a competitor who is boring but consistent.",
	},
	{
		type: "h2",
		text: "What changed in 2026: AI calling, freshness, visuals, and Ask Maps",
	},
	{
		type: "p",
		text: "Four themes show up in product updates and in how aggressive profiles behave in competitive packs: AI-assisted calling and call summaries, freshness pressure that punishes quiet profiles, visual ranking signals that reward authentic job media, and Ask Maps-style answers that synthesize multiple sources instead of letting you stack keywords in Q&A. None of these replace fundamentals — accurate categories, fast mobile pages, legitimate reviews — but they raise the bar for what “good enough” looks like on Google Maps.",
	},
	{
		type: "h3",
		text: "AI-powered calling and what Google learns from your phone behavior",
	},
	{
		type: "p",
		text: "Richer call experiences mean Google can correlate profile taps with call outcomes more tightly than before. If people repeatedly abandon calls from your profile — ring, ring, no answer — that pattern competes with your keyword relevance. For a two-truck HVAC shop in New Hartford or a solo plumber in Rome, the fix is operational: predictable answering, clear handoffs, and scripts that mirror your primary categories so transcripts and summaries align with “furnace repair Syracuse” rather than a generic “we do everything” greeting.",
	},
	{
		type: "h4",
		text: "After-hours coverage that still protects your Maps reputation",
	},
	{
		type: "p",
		text: "You do not need 24/7 live bodies if that is not your model. You do need a designed experience: voicemail that states emergency boundaries, optional SMS opt-in, and honest posted hours that include true holiday coverage. Google rewards reliability — including the boring detail that your posted hours match when someone can reach a human or a guaranteed callback window.",
	},
	{
		type: "h5",
		text: "Simple phone script anchors for plumbers and HVAC crews",
	},
	{
		type: "ul",
		items: [
			"Answer with business name + primary trade + primary city: “This is North Star Plumbing in Utica — are you calling about a leak or a drain?”",
			"If dispatch is busy, say the wait truthfully and offer a text callback number — missed taps with no follow-up compound.",
			"Log the top ten caller questions weekly and mirror them as H2s on your service pages — that feeds entity consistency for Ask Maps.",
		],
	},
	{
		type: "h3",
		text: "Freshness signals and the 30-day “quiet profile” risk",
	},
	{
		type: "p",
		text: "Think of freshness as competitive motion, not a gimmick. When competitors publish weekly photos, seasonal posts, and updated offers, a profile that goes silent for a month can look dormant even if reviews are strong. In CNY, seasonality is your built-in content calendar: pre-winter furnace tune-ups, generator checks before lake-season storms, sump and drainage language right after the thaw, AC startup sequences before the first heat wave. The goal is not noise — it is proof of ongoing operations tied to real weather and real neighborhoods.",
	},
	{
		type: "h4",
		text: "Posting cadence that fits a real crew schedule",
	},
	{
		type: "p",
		text: "A sustainable cadence beats a burst of ten posts followed by silence. Aim for at least one meaningful update every two weeks: a finished job photo, a short clip of a clean truck wrap, a limited-time offer tied to a service you want more of, or a plain-language tip that shows expertise without giving away your whole process. Pair posts with one new photo or album upload when possible — motion across modules matters more than repeating the same text offer.",
	},
	{
		type: "h5",
		text: "Seasonal prompts that match Mohawk Valley and Syracuse weather",
	},
	{
		type: "ul",
		items: [
			"Late fall: humidifier service, frozen hose bib prevention, and storm-ready generator checks for lakeshore homes.",
			"Early spring: sump pump testing, grading and downspout checks, and “first warm weekend” AC startup slots.",
			"Mid-summer: peak-load electrical upgrades for older ranch homes and cottage rewires before short-term rental season.",
		],
	},
	{
		type: "h3",
		text: "Visual content: photos and short video that help you rank on Maps",
	},
	{
		type: "p",
		text: "Stock photography signals “template business.” Authentic imagery signals dispatchable capacity: branded trucks, readable signage, labeled panels, safe before-and-after shots, and short vertical clips that look like they were shot on a job — because they were. Google’s visual models increasingly match imagery to intent; a photo of a labeled manifold gauge reads differently than a glossy brochure van on a white background. For privacy, avoid identifiable homeowner faces without consent, and blur addresses on mailboxes when needed.",
	},
	{
		type: "h4",
		text: "Captions that help local SEO without keyword stuffing",
	},
	{
		type: "p",
		text: "Write captions like a human dispatcher: “Emergency drain clearing — East Utica, same night” beats a comma-separated list of fifteen villages. If you serve both Skaneateles and Canastota, explain the difference in service context (lead times, minimums, or specialty equipment) rather than repeating city tokens. That specificity helps Google cluster you for the right intents and helps Ask Maps quote you accurately.",
	},
	{
		type: "h3",
		text: "Ask Maps, legacy Q&A, and why your whole web footprint has to agree",
	},
	{
		type: "p",
		text: "When conversational answers pull from your profile, reviews, and third-party mentions, the weakest link becomes visible. If your GBP says you offer 24/7 emergency plumbing but your site says “business hours Monday–Friday,” you just taught a model that you are inconsistent. If your reviews constantly mention “great price” but never mention the services you want to grow, you under-train the entity for those services. Clean up contradictions before you chase new keywords — models amplify what is already coherent.",
	},
	{
		type: "h4",
		text: "Reviews as training data: what to ask customers to include",
	},
	{
		type: "p",
		text: "Polite post-job prompts can mention job type and neighborhood without sounding forced: “If you mention the repair and the town, it helps other homeowners find a real local crew.” When you respond publicly, repeat the service in natural language, thank them for specifics, and add one helpful detail future readers care about (timeline, warranty note, or safety step). Avoid identical copy-paste responses — repetition patterns look robotic to both humans and classifiers.",
	},
	{
		type: "h5",
		text: "If you still have legacy Q&A on the profile",
	},
	{
		type: "p",
		text: "Keep answers short, factual, and aligned with your site. Do not turn Q&A into a keyword wall. Prefer linking to a canonical FAQ section on your website for long policy answers (warranties, dispatch radius, financing) so the profile stays clean and the site earns the depth signal.",
	},
	{
		type: "h2",
		text: "Categories, services, and service area: the Maps SEO foundation",
	},
	{
		type: "p",
		text: "Categories are still the strongest declarative signal for what you want to rank for in the Map Pack. Primary category should reflect the majority of revenue you want from Maps calls — not the occasional side job. Secondary categories should reflect real offerings with real pages and proof. If you list “Electrician” but your site has no electrical depth, you are inviting mismatches that hurt conversions even if you rank.",
	},
	{
		type: "h3",
		text: "Service area: radius honesty beats empire-building",
	},
	{
		type: "p",
		text: "CNY geography punishes overreach. If your average dispatch is 25 minutes, do not imply statewide coverage. Name the towns and corridors you actually serve within a sane drive time, and mirror that list on a well-structured service area page on your website. When Google compares phone-in addresses to claimed coverage, exaggeration becomes a silent trust problem.",
	},
	{
		type: "h4",
		text: "Mohawk Valley vs. Syracuse metro: tune expectations separately",
	},
	{
		type: "p",
		text: "Utica–Rome packs can shift with fewer competitors; a strong photo cadence and tight service list can move you quickly. Syracuse packs often include more aggregators and franchises — you may need sharper differentiation: licensed credentials, insurance limits you carry, manufacturer certifications, and proof of local installs. Use the same words on GBP attributes, site badges, and captions so the entity graph lines up.",
	},
	{
		type: "h2",
		text: "The website behind your Google Business Profile link",
	},
	{
		type: "p",
		text: "Your GBP website link should land on a mobile-fast page that reinforces the top three services you want from Maps. Slow vanity homepages, auto-playing hero videos, and buried phone numbers waste the click you paid for in attention. Technical SEO basics still matter: stable Core Web Vitals, readable tap targets, and clear H1–H2 structure that matches how people search (“Syracuse AC repair,” “Rome NY emergency plumber”).",
	},
	{
		type: "h3",
		text: "Heading hierarchy that matches search intent",
	},
	{
		type: "p",
		text: "Use a single clear H1 on the landing page, then H2 sections for each core service city pair you truly serve. H3s can cover sub-services (drain vs. water heater vs. excavation). H4s and H5s are for FAQs, warranty notes, and process steps — the kinds of details customers skim for before they call. This mirrors how long-form service pages earn featured snippets and gives Ask Maps cleaner extraction targets.",
	},
	{
		type: "h3",
		text: "LocalBusiness and service schema without overclaiming",
	},
	{
		type: "p",
		text: "Structured data should reflect visible content: same business name, same phone, same address or service-area logic. Do not inject cities you do not serve. For multi-location someday, each location gets its own GBP and its own page — do not duplicate NAP patterns that confuse Google’s entity resolution.",
	},
	{
		type: "h2",
		text: "Local SEO beyond GBP: citations, brand search, and reputation velocity",
	},
	{
		type: "p",
		text: "Google Maps is one surface; traditional local SEO still includes consistent NAP on high-trust directories, brand + service search behavior, and a steady rhythm of legitimate reviews. In CNY, regional publications, chambers, and sponsor pages can matter more than national spam lists — prioritize accuracy over volume. When your brand is searched alongside “reviews” or “phone number,” make sure the first page of results agrees with GBP.",
	},
	{
		type: "h3",
		text: "Entity gaps to close this quarter",
	},
	{
		type: "ul",
		items: [
			"Align Google Business Profile business name with signage and insurance certificates (minus illegal keyword stuffing).",
			"Resolve duplicate or abandoned listings for old DBA names — duplicates split reviews and weaken authority.",
			"Publish one authoritative “areas we serve” page that lists towns in plain text with driving context, not a wall of ZIP codes.",
			"Track Map Pack rank for 10–15 head terms you actually sell, not vanity terms you never book.",
		],
	},
	{
		type: "blockquote",
		text: "The profile that wins in 2026 is the one where phone behavior, photos, posts, reviews, and website copy all tell the same story about who you are, where you drive, and what you fix.",
	},
	{
		type: "h2",
		text: "Printable checklist: Google Business Profile for CNY contractors",
	},
	{
		type: "ul",
		items: [
			"Verify primary category matches majority revenue; secondaries match real pages.",
			"Posted hours match real answering; update holiday hours early for Thanksgiving and Memorial Day travel spikes.",
			"Upload three new job-tied photos; rotate cover image seasonally.",
			"Schedule two Google Posts for the next 30 days tied to weather or inventory you want to move.",
			"Rewrite business description with city + service pairs you can defend on the phone.",
			"Audit website link target on a mid-tier Android phone on LTE — fix tap targets and lazy loading.",
			"Respond to every new review with specifics; vary wording; no copy-paste blocks.",
			"Remove contradictory offers (24/7 claims vs. posted hours) across GBP, site, and Facebook.",
			"Add SMS or callback promise if live answer is impossible nights — reduce abandoned-call patterns.",
			"Log caller FAQs; mirror top five as short sections on your money landing page.",
		],
	},
	{
		type: "h2",
		text: "Next steps this week (without boiling the ocean)",
	},
	{
		type: "p",
		text: "Pick three actions only: fix the biggest contradiction between GBP and your site, upload three authentic photos with honest captions, and schedule two seasonal posts. Measure outcomes in business terms — booked calls, booked emails, not raw impressions. If you want a second opinion on your profile, your landing page hierarchy, or how your categories line up with how you actually dispatch in Central New York, use the contact page and send your GBP link plus the top three towns you want to own this season.",
	},
	{
		type: "p",
		text: "Google will keep shipping Maps and AI features faster than most small teams can read release notes. The durable strategy is boring and profitable: tell the truth in structured places, prove it with photos and reviews, answer the phone like a local owner, and keep your website fast enough that the click after Maps still converts.",
	},
];

const nextjsMarketingStack: ArticleBlock[] = [
	{
		type: "p",
		text: "This site now runs on Next.js App Router so the marketing pages, richer client interactions, and shared tooling all live in one consistent stack. The goal stayed the same through the rebuild: strong performance, clean content structure, and only as much client-side behavior as the page actually earns.",
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
	"google-business-profile-2026-cny-playbook":
		googleBusinessProfile2026CnyPlaybook,
	"upstate-ny-local-seo-service-businesses-2026": upstateNyLocalSeo2026,
	"website-cost": websiteCost2026,
	"free-lighthouse-audit-utica-ny": freeLighthouseAuditUtica,
	"why-monthly-seo-matters": whyMonthlySeo,
	"contractor-website-mistakes": contractorMistakes,
	"mobile-first-seo": mobileFirstSeo,
	"local-business-schema": localBusinessSchema,
	"site-speed-conversion": siteSpeedConversion,
	"seasonal-business-seo": seasonalSeo,
	"nextjs-marketing-stack": nextjsMarketingStack,
};

export function getArticleBlocksForSlug(
	slug: string,
): ArticleBlock[] | undefined {
	return BLOG_ARTICLE_BLOCKS[slug];
}
