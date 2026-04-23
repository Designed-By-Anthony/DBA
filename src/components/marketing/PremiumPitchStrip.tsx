import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_MONTHLY,
	STANDARD_WEBSITE_STARTING_PRICE,
} from "@/lib/offers";

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
						body: "Lean builds that open quickly on a phone, a free audit you can run yourself, and timelines measured in weeks — not quarters lost to meetings.",
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
						body: `Founding spots (${FOUNDING_PARTNER_BUILD_SLOTS} total) pair a complimentary build with ${FOUNDING_PARTNER_SEO_MONTHLY}/mo growth while the launch program is open. After that, projects start at ${STANDARD_WEBSITE_STARTING_PRICE}, scoped to what the audit shows.`,
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
				];

	return (
		<section className="premium-pitch" aria-labelledby={`premium-pitch-heading-${variant}`}>
			<div className="section-container">
				<div className="premium-pitch__header">
					<p className="page-eyebrow" id={`premium-pitch-heading-${variant}`}>
						What you get here
					</p>
					<h2 className="premium-pitch__title">Fast, considered, and honest about price.</h2>
					<p className="premium-pitch__lede">
						Boutique delivery for Upstate NY service businesses: one senior builder, modern
						performance habits, and quotes tied to what we actually find in your audit.
					</p>
				</div>
				<ul className="premium-pitch__grid">
					{items.map((item) => (
						<li key={item.label} className="surface-card premium-pitch__card reveal-up">
							<span className="premium-pitch__label">{item.label}</span>
							<h3 className="premium-pitch__card-title">{item.title}</h3>
							<p className="premium-pitch__card-body">{item.body}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
