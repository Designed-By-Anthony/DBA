"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";

const items = [
	{
		title: "Lab + field context",
		body: "PageSpeed Insights categories plus crawl and HTML signals so fixes map to revenue.",
		accent: "from-sky-500/20 to-transparent",
	},
	{
		title: "Crawl & index hygiene",
		body: "Robots.txt, sitemap coverage, redirects, and index estimates — the boring stuff that breaks silently.",
		accent: "from-violet-500/15 to-transparent",
	},
	{
		title: "AI executive brief",
		body: "Plain-English summary, weaknesses, and a prioritized queue you can hand to a dev or vendor.",
		accent: "from-amber-500/15 to-transparent",
	},
];

export function LighthouseValueStrip() {
	const prefersReduced = useReducedMotion();

	return (
		<div className="grid gap-4 md:grid-cols-3">
			{items.map((item, i) => (
				<MotionDiv
					key={item.title}
					className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(8,12,22,0.72)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
					initial={prefersReduced ? false : { opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{
						delay: prefersReduced ? 0 : 0.08 * i,
						duration: 0.5,
						ease: [0.22, 1, 0.36, 1],
					}}
					whileHover={
						prefersReduced
							? undefined
							: { y: -4, transition: { duration: 0.22 } }
					}
				>
					<div
						className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`}
						aria-hidden
					/>
					<div className="relative">
						<h3 className="font-display text-base font-semibold tracking-tight text-white">
							{item.title}
						</h3>
						<p className="mt-2 text-sm leading-relaxed text-white/58">
							{item.body}
						</p>
					</div>
				</MotionDiv>
			))}
		</div>
	);
}
