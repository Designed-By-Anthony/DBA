"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";

const proofPoints = [
	{ k: "Runtime", v: "60-90 sec" },
	{ k: "Lens", v: "6 audits" },
	{ k: "Output", v: "Private report" },
];

const signalRows = [
	{
		label: "Performance drag",
		value: "Largest Contentful Paint, scripts, image weight",
		status: "Priority",
		tone: "warm",
	},
	{
		label: "Search readiness",
		value: "Titles, schema, headings, crawl paths",
		status: "Mapped",
		tone: "bronze",
	},
	{
		label: "Trust friction",
		value: "Local proof, accessibility, conversion cues",
		status: "Scored",
		tone: "green",
	},
] as const;

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
					<p className="lh-mini-label">Executive signal</p>
					<p className="lh-diagnostic-title">Revenue leak map</p>
				</div>
				<div className="lh-diagnostic-score">
					<span className="sr-only">Sample audit score 87</span>
					<span aria-hidden>87</span>
				</div>
			</div>

			<div className="lh-diagnostic-meter" aria-hidden>
				<span style={{ width: "87%" }} />
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
							<span className="block font-report text-[15px] font-semibold leading-tight text-white/94">
								{row.label}
							</span>
							<span className="mt-1 block text-[12px] leading-[1.5] text-white/52">
								{row.value}
							</span>
						</span>
						<span className="lh-diagnostic-pill">{row.status}</span>
					</MotionDiv>
				))}
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
			{/* Subtle ambient glow for visual richness */}
			<div
				className="absolute -left-20 top-0 h-80 w-80 rounded-full opacity-20 blur-3xl pointer-events-none"
				style={{
					background:
						"radial-gradient(circle, rgb(var(--accent-bronze-rgb) / 0.12), transparent 70%)",
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
					Website Audit Scanner
				</h1>
			</MotionDiv>

			<MotionDiv
				initial={animate ? { opacity: 0, y: 12 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.18 }}
			>
				<p className="lh-hero-copy">
					A private diagnostic for the money leaks in your site: speed,
					technical SEO, accessibility, local trust, and conversion friction.
					You get the scores, the context, and the fix list without the generic
					tool noise.
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
