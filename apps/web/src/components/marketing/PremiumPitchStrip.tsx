import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_MONTHLY,
	STANDARD_WEBSITE_INSTALLMENT_EACH,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";

/* Inline Tailwind: premium-pitch-* classes (layout-shell.css). */
const SECTION =
	"py-[var(--section-space-tight)] border-y border-white/[0.05] bg-[linear-gradient(180deg,rgba(8,12,20,0.35)_0%,transparent_100%)]";
const HEADER = "max-w-[52rem] mx-auto mb-8 text-center";
const TITLE =
	"font-[family-name:var(--font-display)] text-[clamp(1.45rem,3.2vw,2rem)] font-extrabold tracking-[-0.04em] leading-[1.2] mt-2 mb-3 text-[var(--text-cream)]";
const LEDE = "m-0 text-[var(--text-gray)] text-[1.02rem] leading-[1.65]";
const GRID =
	"list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
const CARD =
	"surface-card reveal-up p-[1.35rem_1.25rem] flex flex-col gap-[0.45rem] min-h-full transition-[border-color,box-shadow] duration-[var(--motion-duration-normal,0.28s)] [transition-timing-function:var(--ease-out,ease)] focus-within:border-[rgba(212,175,55,0.4)] focus-within:shadow-[0_12px_40px_-24px_rgba(212,175,55,0.45)]";
const LABEL =
	"text-[0.68rem] font-extrabold tracking-[0.2em] uppercase text-[rgba(232,213,168,0.95)]";
const CARD_TITLE =
	"text-[1.08rem] font-extrabold tracking-[-0.03em] m-0 leading-[1.25]";
const CARD_BODY =
	"m-0 text-[0.9rem] leading-[1.55] text-[var(--text-gray)] flex-1";

export function PremiumPitchStrip({
	variant = "home",
}: {
	variant?: "home" | "services";
}) {
	const items =
		variant === "home"
			? [
					{
						label: "Fast",
						title: "Built to load on a phone",
						body: "Lean builds that open quickly on a phone, contact us for your free audit, and timelines measured in weeks — not quarters lost to meetings.",
					},
					{
						label: "Stylish",
						title: "Yours, not a template",
						body: "Layout and type tuned so you look like a real shop someone would call — not a theme someone picked in ten minutes.",
					},
					{
						label: "High-ranking",
						title: "SEO that does not feel bolted on",
						body: "Clean structure, fast pages, and the behind-the-scenes tags Google actually reads — so your service area and offers are clear from day one.",
					},
					{
						label: "Fair price",
						title: "Numbers before the invoice",
						body: `Most standard scopes: three payments of ${STANDARD_WEBSITE_INSTALLMENT_EACH} at launch (typical total ${STANDARD_WEBSITE_TYPICAL_RANGE}) with three months of hosting + core SEO bundled. Founding spots (${FOUNDING_PARTNER_BUILD_SLOTS} total) still pair a complimentary build with ${FOUNDING_PARTNER_SEO_MONTHLY}/mo growth. Simple sites from ${STANDARD_WEBSITE_STARTING_PRICE}.`,
					},
					{
						label: "Yours to keep",
						title: "You pay, you own the code",
						body: "When the build is done, the source code is yours. No hostage fees, no takedowns if you leave. The monthly retainer covers SEO and hosting — not permission to keep your own site running.",
					},
				]
			: [
					{
						label: "Fast",
						title: "Momentum, not meetings",
						body: "Lean stack and direct communication — fewer calls, faster iterations, and a site that earns phone calls sooner.",
					},
					{
						label: "Stylish",
						title: "Built to earn trust fast",
						body: "Hierarchy, proof, and mobile polish so people believe you before they read every line.",
					},
					{
						label: "High-ranking",
						title: "Local + technical SEO",
						body: "Structure and tags Google reads, plus page speed that matches how people really search for trades and service businesses.",
					},
					{
						label: "Fair price",
						title: "No mystery bundles",
						body: `Scope tied to what you need: audit-first recommendations, clear phases, and founder-friendly entry when spots remain (${FOUNDING_PARTNER_BUILD_SLOTS} launch builds + ${FOUNDING_PARTNER_SEO_MONTHLY}/mo SEO tier).`,
					},
					{
						label: "Yours to keep",
						title: "You own every line of code",
						body: "The finished site belongs to you — source code, assets, and all. No lock-in, no takedown threats. Our monthly plan is for growth, not for keeping the lights on.",
					},
				];

	return (
		<section
			className={SECTION}
			aria-labelledby={`premium-pitch-heading-${variant}`}
		>
			<div className="section-container">
				<div className={HEADER}>
					<p className="page-eyebrow" id={`premium-pitch-heading-${variant}`}>
						What you get here
					</p>
					<h2 className={TITLE}>Fast, considered, and honest about price.</h2>
					<p className={LEDE}>
						Boutique delivery for Upstate NY service businesses: one senior
						builder, modern performance habits, and quotes tied to what we
						actually find in your audit.
					</p>
				</div>
				<ul className={GRID}>
					{items.map((item) => (
						<li key={item.label} className={CARD}>
							<span className={LABEL}>{item.label}</span>
							<h3 className={CARD_TITLE}>{item.title}</h3>
							<p className={CARD_BODY}>{item.body}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
