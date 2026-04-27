"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import { useEffect, useMemo, useState } from "react";

const FACTS = [
	"We correlate PageSpeed lab data with how real customers experience your site.",
	"We read your homepage HTML for titles, schema, headings, and conversion cues.",
	"We check robots.txt and sitemap signals so search engines can crawl you cleanly.",
	"When Places data is available, we blend local reputation into your trust score.",
	"Our AI turns raw signals into a plain-English plan you can act on this week.",
];

export type ScanPhase = "pagespeed" | "onpage" | "crawl" | "local" | "ai";

const PHASES: Array<{
	id: ScanPhase;
	label: string;
	description: string;
}> = [
	{
		id: "pagespeed",
		label: "PageSpeed Insights",
		description:
			"Lab performance, accessibility, SEO & best-practice categories.",
	},
	{
		id: "onpage",
		label: "On-page SEO",
		description: "Meta tags, headings, schema hints, and content signals.",
	},
	{
		id: "crawl",
		label: "Crawl health",
		description: "Robots.txt, sitemap, and redirect sanity.",
	},
	{
		id: "local",
		label: "Local context",
		description: "Maps listing signal when your Places key is configured.",
	},
	{
		id: "ai",
		label: "AI narrative",
		description: "Executive summary and prioritized fixes in plain English.",
	},
];

function phaseIndex(phase: ScanPhase): number {
	return PHASES.findIndex((p) => p.id === phase);
}

export function AuditScanProgress({
	activePhase,
	message,
}: {
	activePhase: ScanPhase;
	message: string;
}) {
	const prefersReduced = useReducedMotion();
	const [factIndex, setFactIndex] = useState(0);
	const idx = phaseIndex(activePhase);
	const progressPct = useMemo(() => {
		const step = 100 / PHASES.length;
		return Math.min(100, Math.round((idx + 0.65) * step));
	}, [idx]);

	useEffect(() => {
		const t = window.setInterval(() => {
			setFactIndex((i) => (i + 1) % FACTS.length);
		}, 4500);
		return () => window.clearInterval(t);
	}, []);

	const cardBase =
		"lighthouse-phase-card rounded-xl border px-4 py-3 transition-colors";

	return (
		<div className="space-y-6">
			<MotionDiv
				className="lighthouse-scan-hero glass-card relative overflow-hidden p-6 md:p-8"
				initial={prefersReduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
			>
				<MotionDiv
					className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl"
					aria-hidden
					animate={
						prefersReduced
							? undefined
							: {
									scale: [1, 1.06, 1],
									opacity: [0.45, 0.65, 0.45],
								}
					}
					transition={
						prefersReduced
							? undefined
							: {
									duration: 6,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}
					}
				/>
				<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
					Deep scan in progress
				</p>
				<div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h3 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
							Building your report
						</h3>
						<MotionDiv
							key={message}
							initial={prefersReduced ? false : { opacity: 0, x: -6 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.35 }}
							className="mt-1 max-w-xl text-sm leading-relaxed text-white/60"
						>
							{message}
						</MotionDiv>
					</div>
					<MotionDiv
						className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10"
						aria-hidden
						animate={
							prefersReduced
								? undefined
								: { rotate: [0, 3, -3, 0], scale: [1, 1.02, 1] }
						}
						transition={
							prefersReduced
								? undefined
								: {
										duration: 2.8,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									}
						}
					>
						<div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400/25 border-t-sky-300" />
					</MotionDiv>
				</div>
				<div className="mb-3">
					<div className="mb-1 flex justify-between text-[11px] font-medium uppercase tracking-wider text-white/45">
						<span>Overall progress</span>
						<span>{progressPct}%</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
						<MotionDiv
							className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"
							initial={false}
							animate={{ width: `${progressPct}%` }}
							transition={{ type: "spring", stiffness: 120, damping: 18 }}
						/>
					</div>
				</div>
				<MotionDiv
					key={factIndex}
					initial={prefersReduced ? false : { opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="text-sm leading-relaxed text-sky-100/75"
				>
					{FACTS[factIndex]}
				</MotionDiv>
			</MotionDiv>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				{PHASES.map((p, i) => {
					const done = i < idx;
					const current = i === idx;
					const borderClass = current
						? "border-sky-400/45 bg-sky-500/[0.12] shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
						: done
							? "border-emerald-500/25 bg-emerald-500/[0.08]"
							: "border-white/[0.08] bg-[rgba(6,10,18,0.45)]";

					return (
						<MotionDiv
							key={p.id}
							className={`${cardBase} ${borderClass}`}
							initial={prefersReduced ? false : { opacity: 0, y: 22 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: prefersReduced ? 0 : 0.06 * i,
								duration: 0.45,
								ease: [0.22, 1, 0.36, 1],
							}}
							whileHover={
								prefersReduced
									? undefined
									: { y: -3, transition: { duration: 0.2 } }
							}
							layout
						>
							<div className="mb-2 flex items-center justify-between gap-2">
								<span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
									Step {i + 1}
								</span>
								{done ? (
									<MotionDiv
										initial={prefersReduced ? false : { scale: 0 }}
										animate={{ scale: 1 }}
										className="text-emerald-400"
										title="Complete"
									>
										✓
									</MotionDiv>
								) : current ? (
									<span
										className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-400"
										aria-hidden
									/>
								) : (
									<span className="text-white/25">○</span>
								)}
							</div>
							<p className="font-display text-sm font-semibold text-white">
								{p.label}
							</p>
							<p className="mt-1 text-[11px] leading-snug text-white/50">
								{p.description}
							</p>
						</MotionDiv>
					);
				})}
			</div>
		</div>
	);
}
