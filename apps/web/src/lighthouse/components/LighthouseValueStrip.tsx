"use client";

const phases = [
	{
		num: "01",
		title: "Lab performance",
		body: "PageSpeed lab scores, Core Web Vitals, mobile load time, and what's actually slowing your visitors down.",
	},
	{
		num: "02",
		title: "Search structure",
		body: "Titles, meta descriptions, structured data, and crawlability — everything Google uses to rank and index your pages.",
	},
	{
		num: "03",
		title: "Trust signals",
		body: "Accessibility basics, HTTPS posture, local credibility markers, forms, and calls to action.",
	},
	{
		num: "04",
		title: "Local context",
		body: "Google Business and local authority signals that matter for service-area businesses competing in your market.",
	},
	{
		num: "05",
		title: "AI fix list",
		body: "Plain-English next steps ranked by business impact — not raw numbers, but specific things to fix this week.",
	},
];

export function LighthouseValueStrip() {
	return (
		<section className="lh-process" aria-labelledby="lh-process-heading">
			<div className="lh-process-heading">
				<div>
					<p className="lighthouse-result-eyebrow">What the scan covers</p>
					<h2 id="lh-process-heading" className="lh-process-title">
						Five checks. One clear picture of where your site stands.
					</h2>
				</div>
				<p className="lh-process-note">
					Built for local service businesses that need the next move, not a pile
					of disconnected scores.
				</p>
			</div>

			<ol className="lh-process-grid">
				{phases.map((phase) => (
					<li key={phase.num} className="lh-process-step">
						<span className="lh-process-num">{phase.num}</span>
						<span className="lh-process-copy">
							<strong>{phase.title}</strong>
							<span>{phase.body}</span>
						</span>
					</li>
				))}
			</ol>
		</section>
	);
}
