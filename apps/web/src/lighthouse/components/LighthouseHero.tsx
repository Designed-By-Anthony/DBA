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

/* ── Phase 1B SEV-0 inline replacements (was .lh-row-status* in lighthouse-globals.css). */
const ROW_STATUS_BASE = "w-[0.45rem] h-10 rounded-full shrink-0";
const ROW_STATUS_TONE = {
	red: "bg-[#f87171] shadow-[0_0_8px_rgba(248,113,113,0.45)]",
	warm: "bg-[#d88958]",
	bronze: "bg-[rgb(var(--accent-bronze-rgb))]",
	green: "bg-[#4fc58f]",
} as const;

/* Bronze pill (was .lh-diagnostic-pill — was sky-blue, retargeted to canonical bronze). */
const DIAGNOSTIC_PILL =
	"inline-flex items-center px-2 py-0.5 rounded-full border border-[rgb(var(--accent-bronze-rgb)/0.3)] bg-[rgb(var(--accent-bronze-rgb)/0.08)] text-[0.55rem] font-extrabold tracking-[0.12em] uppercase text-[rgb(var(--accent-bronze-rgb)/0.95)] whitespace-nowrap";

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
					className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-display)] text-[13px] font-bold"
					style={{ color }}
					aria-hidden="true"
				>
					{score}
				</span>
			</div>
			<span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
				{label}
			</span>
		</div>
	);
}

function DiagnosticPreview({ animate }: { animate: boolean }) {
	return (
		<MotionDiv
			className="relative mt-12 max-w-[42rem] rounded-2xl border border-white/[0.08] bg-linear-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_-32px_rgba(0,0,0,0.5)]"
			initial={animate ? { opacity: 0, y: 18 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.72, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className="flex items-start justify-between gap-3 mb-4">
				<div>
					<p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">
						Sample audit report
					</p>
					<p className="font-[family-name:var(--font-fraunces)] text-base font-semibold text-white">
						local-roofing.com
					</p>
				</div>
				<span className={DIAGNOSTIC_PILL}>Preview</span>
			</div>

			<div
				className="my-4 grid grid-cols-4 gap-2 rounded-lg border border-white/[0.055] bg-white/[0.025] py-3"
				aria-hidden="true"
			>
				{SAMPLE_SCORES.map((s) => (
					<MiniScoreRing key={s.label} {...s} />
				))}
			</div>

			<div className="flex flex-col gap-2.5">
				{signalRows.map((row, index) => (
					<MotionDiv
						key={row.label}
						className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"
						initial={animate ? { opacity: 0, x: -10 } : false}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: 0.45,
							delay: 0.48 + index * 0.08,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<span
							className={`${ROW_STATUS_BASE} ${ROW_STATUS_TONE[row.tone]}`}
							aria-hidden
						/>
						<span className="min-w-0">
							<span className="block font-[family-name:var(--font-display)] text-[14px] font-semibold leading-tight text-white/95">
								{row.label}
							</span>
							<span className="mt-0.5 block text-[11.5px] leading-[1.5] text-white/50">
								{row.value}
							</span>
						</span>
						<span className={DIAGNOSTIC_PILL}>{row.status}</span>
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
			className="relative max-w-3xl pt-[var(--space-element)] pb-[var(--space-block)]"
			aria-labelledby="lighthouse-hero-heading"
		>
			{/* Ambient glow — twin bronze halos (left + right) for warm symmetry.
			    The right-side stale blue (rgba(91,156,248,*)) was retired in
			    Phase 4 SEV-2 along with the broader bronze sweep. */}
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
						"radial-gradient(circle, rgba(212,175,55,0.08), transparent 70%)",
				}}
				aria-hidden
			/>
			<MotionDiv
				className="inline-flex items-center gap-[0.55rem] text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--accent-bronze-rgb)/0.92)] mb-4"
				initial={animate ? { opacity: 0, x: -6 } : false}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
			>
				<span
					className="inline-block w-7 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--accent-bronze-rgb)/0.85)_60%,rgb(var(--accent-bronze-rgb)/0.15))]"
					aria-hidden
				/>
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
				<h1
					id="lighthouse-hero-heading"
					className="font-[family-name:var(--font-fraunces)] text-[clamp(2.55rem,5.5vw,4.85rem)] font-bold tracking-[-0.02em] leading-[1.0] text-[var(--text-cream)] text-balance mb-0"
				>
					Know What's Costing You Customers.
				</h1>
			</MotionDiv>

			<MotionDiv
				initial={animate ? { opacity: 0, y: 12 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.18 }}
			>
				<p className="mt-6 max-w-[64ch] text-[clamp(1rem,1.5vw,1.12rem)] leading-[1.75] text-white/70">
					Get a full scored breakdown of your site's speed, SEO gaps, and trust
					signals — with a prioritized AI fix list. Free, private, and ready in
					about 60 seconds.
				</p>
			</MotionDiv>

			<MotionDiv
				className="mt-12 grid grid-cols-3 gap-4 max-w-md"
				initial={animate ? { opacity: 0, y: 10 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.55, delay: 0.32 }}
			>
				{proofPoints.map((point) => (
					<div
						key={point.k}
						className="flex flex-col items-start min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
					>
						<span className="font-[family-name:var(--font-display)] text-[17px] font-semibold leading-none text-white">
							{point.v}
						</span>
						<span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
							{point.k}
						</span>
					</div>
				))}
			</MotionDiv>

			<DiagnosticPreview animate={animate} />
		</section>
	);
}
