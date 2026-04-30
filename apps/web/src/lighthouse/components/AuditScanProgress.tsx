"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import { useEffect, useMemo, useState } from "react";

/**
 * Rotating fact carousel shown while an audit is running.
 * Replaces the previous five-up step grid (which forced the user to
 * scroll while the report was being built). The single hero card now
 * cycles SEO / web-design / internet trivia + the live phase the
 * scanner is on, all gold-led.
 */

type Fact = {
	tag: string;
	title: string;
	body: string;
};

const FACTS: Fact[] = [
	{
		tag: "Speed",
		title: "53% bounce after 3 seconds",
		body: "Google found that more than half of mobile visitors leave a page that takes longer than three seconds to load. Every 100 ms shaved off your LCP is real revenue.",
	},
	{
		tag: "Search",
		title: "0.78% click rate on page two",
		body: "Roughly 99% of clicks happen on the first page of Google. If you're not in the top ten, you're effectively invisible — even for the right query.",
	},
	{
		tag: "Trust",
		title: "88% won't return after a bad UX",
		body: "Cramped layouts, slow forms, broken images — visitors translate friction directly into lost trust. Polish is conversion.",
	},
	{
		tag: "Mobile",
		title: "63% of search starts on phone",
		body: "Google indexes the mobile version of your site first. If your tablet/desktop layout looks beautiful but your phone view is cramped, you lose ranking before a human ever sees you.",
	},
	{
		tag: "Local",
		title: "76% visit a business within 24h",
		body: "Three out of four people who run a local search on their phone walk into a related business that same day — making local schema, hours, and reviews the highest-ROI markup on the internet.",
	},
	{
		tag: "Content",
		title: "8 seconds is the new attention span",
		body: "We scan headers and bullets before we ever read a paragraph. A page without clear H2/H3 structure forfeits the read.",
	},
	{
		tag: "AI",
		title: "Schema is the new SEO",
		body: "AI summaries (Google AIO, ChatGPT Search, Perplexity) lean heavily on JSON-LD. Clean schema is what gets you cited in the answer box, not just listed below it.",
	},
	{
		tag: "Conversion",
		title: "Each form field cuts 4–11%",
		body: "Reducing a contact form from seven fields to three has been shown to lift submission rates by ~40%. Asking for less wins more.",
	},
	{
		tag: "Brand",
		title: "Consistent color = +23% recall",
		body: "Repeating the same accent color across pages lifts brand recognition by nearly a quarter. Picking a hero color and committing to it is one of the cheapest wins in design.",
	},
	{
		tag: "Hosting",
		title: "Edge networks beat origins",
		body: "Cloudflare, Fastly, and Vercel route visitors to a server within ~30ms of where they live. Same code, half the latency, no-code change required.",
	},
];

export type ScanPhase = "pagespeed" | "onpage" | "crawl" | "local" | "ai";

const PHASES: Array<{ id: ScanPhase; label: string }> = [
	{ id: "pagespeed", label: "PageSpeed" },
	{ id: "onpage", label: "On-page SEO" },
	{ id: "crawl", label: "Crawl health" },
	{ id: "local", label: "Local context" },
	{ id: "ai", label: "AI narrative" },
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
		}, 5500);
		return () => window.clearInterval(t);
	}, []);

	const fact = FACTS[factIndex];

	return (
		<div className="lh-scan-shell">
			<MotionDiv
				className="lh-scan-hero glass-card relative overflow-hidden"
				initial={prefersReduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			>
				{/* Gold ambient glow */}
				<MotionDiv
					className="lh-scan-hero__glow"
					aria-hidden
					animate={
						prefersReduced
							? undefined
							: { opacity: [0.45, 0.7, 0.45], scale: [1, 1.06, 1] }
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

				<div className="lh-scan-hero__row">
					<div className="lh-scan-hero__heading">
						<p className="lh-scan-hero__eyebrow">Deep scan in progress</p>
						<h3 className="lh-scan-hero__title">Building your report</h3>
						<MotionDiv
							key={message}
							initial={prefersReduced ? false : { opacity: 0, x: -4 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
							className="lh-scan-hero__message"
						>
							{message}
						</MotionDiv>
					</div>
					<MotionDiv
						className="lh-scan-hero__spinner"
						aria-hidden
						animate={
							prefersReduced
								? undefined
								: { rotate: [0, 1.5, -1.5, 0], scale: [1, 1.02, 1] }
						}
						transition={
							prefersReduced
								? undefined
								: {
										duration: 3,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									}
						}
					>
						<div
							className="lh-scan-hero__spinner-ring"
							style={{ animationDuration: "1.2s" }}
						/>
					</MotionDiv>
				</div>

				{/* Phase pips + progress bar */}
				<div className="lh-scan-progress">
					<div className="lh-scan-progress__row">
						<span>Overall progress</span>
						<span>{progressPct}%</span>
					</div>
					<div className="lh-scan-progress__track">
						<MotionDiv
							className="lh-scan-progress__fill"
							initial={false}
							animate={{ width: `${progressPct}%` }}
							transition={{ type: "spring", stiffness: 110, damping: 22 }}
						/>
					</div>
					<ol className="lh-scan-pips" aria-label="Audit phases">
						{PHASES.map((p, i) => {
							const done = i < idx;
							const current = i === idx;
							const state = done ? "done" : current ? "active" : "pending";
							return (
								<li key={p.id} className={`lh-scan-pip lh-scan-pip--${state}`}>
									<span className="lh-scan-pip__dot" aria-hidden />
									<span className="lh-scan-pip__label">{p.label}</span>
								</li>
							);
						})}
					</ol>
				</div>
			</MotionDiv>

			{/* Rotating fact tile */}
			<div className="lh-fact-stage">
				<MotionDiv
					key={factIndex}
					className="lh-fact-card glass-card"
					initial={prefersReduced ? false : { opacity: 0, y: 14, scale: 0.985 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={prefersReduced ? undefined : { opacity: 0, y: -10 }}
					transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
				>
					<p className="lh-fact-card__tag">Did you know · {fact.tag}</p>
					<h4 className="lh-fact-card__title">{fact.title}</h4>
					<p className="lh-fact-card__body">{fact.body}</p>
				</MotionDiv>
				<div className="lh-fact-dots" role="tablist" aria-label="Fact carousel">
					{FACTS.map((f, i) => (
						<button
							key={f.title}
							type="button"
							role="tab"
							aria-selected={i === factIndex}
							aria-label={`Fact ${i + 1} of ${FACTS.length}`}
							className={`lh-fact-dot${i === factIndex ? " lh-fact-dot--active" : ""}`}
							onClick={() => setFactIndex(i)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
