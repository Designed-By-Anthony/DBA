"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import type { KeyboardEvent } from "react";
import { useCallback, useState } from "react";

const items = [
	{
		title: "Lab + field context",
		backTitle: "What we measure",
		body: "PageSpeed Insights categories plus crawl and HTML signals so fixes map to revenue.",
		accent: "from-sky-500/20 to-transparent",
	},
	{
		title: "Crawl & index hygiene",
		backTitle: "Why it matters",
		body: "Robots.txt, sitemap coverage, redirects, and index estimates — the boring stuff that breaks silently.",
		accent: "from-violet-500/15 to-transparent",
	},
	{
		title: "AI executive brief",
		backTitle: "What you get",
		body: "Plain-English summary, weaknesses, and a prioritized queue you can hand to a dev or vendor.",
		accent: "from-amber-500/15 to-transparent",
	},
];

function FlipValueCard({
	item,
	prefersReduced,
}: {
	item: (typeof items)[number];
	prefersReduced: boolean | null;
}) {
	const [flipped, setFlipped] = useState(false);

	const toggle = useCallback(() => {
		setFlipped((f) => !f);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggle();
			}
		},
		[toggle],
	);

	if (prefersReduced) {
		return (
			<div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(8,12,22,0.72)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div
					className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`}
					aria-hidden
				/>
				<div className="relative">
					<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">
						{item.backTitle}
					</p>
					<h3 className="mt-1 font-display text-base font-semibold tracking-tight text-white">
						{item.title}
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-white/58">
						{item.body}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="lighthouse-flip-scene w-full">
			<button
				type="button"
				className="group relative w-full cursor-pointer rounded-2xl border border-white/[0.08] bg-transparent p-0 text-left shadow-none outline-none ring-sky-400/40 focus-visible:ring-2"
				onClick={toggle}
				onKeyDown={onKeyDown}
				aria-expanded={flipped}
				aria-label={`${item.title}. Tap to flip.`}
			>
				<div
					className="lighthouse-flip-inner rounded-2xl bg-[rgba(8,12,22,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
					data-flipped={flipped ? "true" : "false"}
				>
					<div
						className={`lighthouse-flip-face flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-[rgba(8,12,22,0.85)] p-5`}
					>
						<div
							className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`}
							aria-hidden
						/>
						<div className="relative flex min-h-[9rem] flex-col justify-between">
							<div>
								<h3 className="font-display text-base font-semibold tracking-tight text-white">
									{item.title}
								</h3>
								<p className="mt-3 text-xs font-medium uppercase tracking-wider text-white/40">
									Tap for detail
								</p>
							</div>
							<span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-200/85">
								Flip
							</span>
						</div>
					</div>
					<div
						className={`lighthouse-flip-face lighthouse-flip-face--back flex flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-[rgba(10,16,30,0.95)] p-5`}
					>
						<div
							className={`pointer-events-none absolute inset-0 bg-gradient-to-tl ${item.accent} opacity-50`}
							aria-hidden
						/>
						<div className="relative flex min-h-[9rem] flex-col">
							<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/75">
								{item.backTitle}
							</p>
							<p className="mt-3 text-sm leading-relaxed text-white/72">
								{item.body}
							</p>
							<p className="mt-auto pt-4 text-[10px] font-medium uppercase tracking-wider text-white/35">
								Tap to flip back
							</p>
						</div>
					</div>
				</div>
			</button>
		</div>
	);
}

export function LighthouseValueStrip() {
	const prefersReduced = useReducedMotion();

	return (
		<div className="lighthouse-flip-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item, i) => (
				<MotionDiv
					key={item.title}
					initial={prefersReduced ? false : { opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-32px" }}
					transition={{
						delay: prefersReduced ? 0 : 0.08 * i,
						duration: 0.5,
						ease: [0.22, 1, 0.36, 1] as const,
					}}
				>
					<FlipValueCard item={item} prefersReduced={prefersReduced} />
				</MotionDiv>
			))}
		</div>
	);
}
