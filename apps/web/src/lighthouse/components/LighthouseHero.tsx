"use client";

const proofPoints = [
	{ k: "Cost", v: "Free" },
	{ k: "Time", v: "~60s" },
	{ k: "AI Fix List", v: "Included" },
];

const SAMPLE_SCORES = [
	{ score: 52, label: "Perf", color: "#f87171" },
	{ score: 71, label: "SEO", color: "#fbbf24" },
	{ score: 65, label: "A11y", color: "#fbbf24" },
	{ score: 88, label: "Best", color: "#4ade80" },
] as const;

const signalRows = [
	{
		label: "Largest Contentful Paint",
		value: "4.8 s — well above 2.5 s goal",
		status: "Fix First",
		tone: "red",
	},
	{
		label: "Meta description missing",
		value: "Not set on /services and /about",
		status: "SEO Gap",
		tone: "warm",
	},
	{
		label: "LocalBusiness schema",
		value: "Not detected on homepage",
		status: "Trust Gap",
		tone: "bronze",
	},
] as const;

function MiniScoreRing({
	score,
	label,
	color,
}: {
	score: number;
	label: string;
	color: string;
}) {
	const r = 20;
	const c = 2 * Math.PI * r;
	const offset = c - (score / 100) * c;
	return (
		<div className="lh-mini-score">
			<div className="lh-mini-score-ring">
				<svg
					className="lh-mini-score-svg"
					viewBox="0 0 48 48"
					aria-hidden="true"
				>
					<circle
						cx="24"
						cy="24"
						r={r}
						stroke="rgba(255,255,255,0.07)"
						strokeWidth="4"
						fill="none"
					/>
					<circle
						cx="24"
						cy="24"
						r={r}
						stroke={color}
						strokeWidth="4"
						fill="none"
						strokeDasharray={c}
						strokeDashoffset={offset}
						strokeLinecap="round"
					/>
				</svg>
				<span className="lh-mini-score-value" aria-hidden="true">
					{score}
				</span>
			</div>
			<span>{label}</span>
		</div>
	);
}

function DiagnosticPreview() {
	return (
		<div className="lh-diagnostic-board">
			<div className="lh-diagnostic-topline">
				<div>
					<p className="lh-mini-label">Sample audit report</p>
					<p className="lh-diagnostic-title">local-roofing.com</p>
				</div>
				<span className="lh-diagnostic-pill">Preview</span>
			</div>

			<div className="lh-mini-score-grid" aria-hidden="true">
				{SAMPLE_SCORES.map((s) => (
					<MiniScoreRing key={s.label} {...s} />
				))}
			</div>

			<div className="lh-diagnostic-rows">
				{signalRows.map((row) => (
					<div key={row.label} className="lh-diagnostic-row">
						<span
							className={`lh-row-status lh-row-status--${row.tone}`}
							aria-hidden
						/>
						<span className="lh-diagnostic-copy">
							<strong>{row.label}</strong>
							<span>{row.value}</span>
						</span>
						<span className="lh-diagnostic-pill">{row.status}</span>
					</div>
				))}
			</div>

			<div className="lh-diagnostic-footer">
				<span className="lh-diagnostic-footer-dot" aria-hidden="true" />
				<span>Full PageSpeed data · SEO breakdown · AI fix list</span>
			</div>
		</div>
	);
}

export function LighthouseHero() {
	return (
		<section
			className="lighthouse-hero"
			aria-labelledby="lighthouse-hero-heading"
		>
			<div className="lh-place-marker">
				<span className="lh-place-marker-rule" aria-hidden />
				<span>The Diagnostic Bench</span>
			</div>

			<div>
				<h1 id="lighthouse-hero-heading" className="lh-editorial-h1">
					Know What's Costing You Customers.
				</h1>
			</div>

			<div>
				<p className="lh-hero-copy">
					Get a full scored breakdown of your site's speed, SEO gaps, and trust
					signals — with a prioritized AI fix list. Free, private, and ready in
					about 60 seconds.
				</p>
			</div>

			<div className="lh-hero-proof-row">
				{proofPoints.map((point) => (
					<div key={point.k} className="lh-hero-proof">
						<span>{point.v}</span>
						<small>{point.k}</small>
					</div>
				))}
			</div>

			<DiagnosticPreview />
		</section>
	);
}
