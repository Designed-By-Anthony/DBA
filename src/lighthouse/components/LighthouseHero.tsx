"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";

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
}: { score: number; label: string; color: string }) {
	const r = 20;
	const c = 2 * Math.PI * r;
	const offset = c - (score / 100) * c;
	return (
		<div className="flex flex-col items-center gap-1.5">
			<div className="relative" style={{ width: 48, height: 48 }}>
				<svg
					className="-rotate-90 h-full w-full"
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
						style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
					/>
				</svg>
				<span
					className="absolute inset-0 flex items-center justify-center font-report text-[13px] font-bold"
					style={{ color }}
					aria-hidden="true"
				>
					{score}
				</span>
			</div>
			<span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/38">
				{label}
			</span>
		</div>
	);
}

function DiagnosticPreview({ animate }: { animate: boolean }) {
	return (
		<MotionDiv
			className="lh-diagnostic-board"
			initial={animate ? { opacity: 0, y: 18 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.72, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className="lh-diagnostic-topline">
				<div>
					<p className="lh-mini-label">Sample audit report</p>
					<p className="lh-diagnostic-title">local-roofing.com</p>
				</div>
				<span className="lh-diagnostic-pill">Preview</span>
			</div>

			<div
				className="my-4 grid grid-cols-4 gap-2 rounded-lg border border-white/[0.055] bg-white/[0.025] py-3"
				aria-hidden="true"
			>
				{SAMPLE_SCORES.map((s) => (
					<MiniScoreRing key={s.label} {...s} />
				))}
			</div>

			<div className="lh-diagnostic-rows">
				{signalRows.map((row, index) => (
					<MotionDiv
						key={row.label}
						className="lh-diagnostic-row"
						initial={animate ? { opacity: 0, x: -10 } : false}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: 0.45,
							delay: 0.48 + index * 0.08,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<span
							className={`lh-row-status lh-row-status--${row.tone}`}
							aria-hidden
						/>
						<span className="min-w-0">
							<span className="block font-report text-[14px] font-semibold leading-tight text-white/92">
								{row.label}
							</span>
							<span className="mt-0.5 block text-[11.5px] leading-[1.5] text-white/48">
								{row.value}
							</span>
						</span>
						<span className="lh-diagnostic-pill">{row.status}</span>
					</MotionDiv>
				))}
			</div>

			<div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
				<span
					className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.45)]"
					aria-hidden="true"
				/>
				<span className="text-[11px] text-white/40">
					Full PageSpeed data · SEO breakdown · AI fix list
				</span>
			</div>
		</MotionDiv>
	);
}

export function LighthouseHero() {
	const prefersReduced = useReducedMotion();
	const animate = !prefersReduced;

	return (
		<section
			className="lighthouse-hero relative"
			aria-labelledby="lighthouse-hero-heading"
		>
			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
				style={{
					background:
						"radial-gradient(circle, rgb(var(--accent-bronze-rgb) / 0.14), transparent 70%)",
				}}
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute -right-10 top-20 h-72 w-72 rounded-full opacity-15 blur-3xl"
				style={{
					background:
						"radial-gradient(circle, rgba(91,156,248,0.14), transparent 70%)",
				}}
				aria-hidden
			/>
			<MotionDiv
				className="lh-place-marker"
				initial={animate ? { opacity: 0, x: -6 } : false}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
			>
				<span className="lh-place-marker-rule" aria-hidden />
				<span>The Diagnostic Bench</span>
			</MotionDiv>

			<MotionDiv
				initial={animate ? { opacity: 0, y: 16 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.7,
					delay: 0.05,
					ease: [0.22, 1, 0.36, 1],
				}}
			>
				<h1 id="lighthouse-hero-heading" className="lh-editorial-h1">
					Know What's Costing You Customers.
				</h1>
			</MotionDiv>

			<MotionDiv
				initial={animate ? { opacity: 0, y: 12 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.18 }}
			>
				<p className="lh-hero-copy">
					Get a full scored breakdown of your site's speed, SEO gaps, and trust
					signals — with a prioritized AI fix list. Free, private, and ready in
					about 60 seconds.
				</p>
			</MotionDiv>

			<MotionDiv
				className="lh-hero-proof-row"
				initial={animate ? { opacity: 0, y: 10 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.55, delay: 0.32 }}
			>
				{proofPoints.map((point) => (
					<div key={point.k} className="lh-hero-proof">
						<span className="font-report text-[17px] font-semibold leading-none text-white">
							{point.v}
						</span>
						<span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/42">
							{point.k}
						</span>
					</div>
				))}
			</MotionDiv>

			<DiagnosticPreview animate={animate} />
		</section>
	);
}
