"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";

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
	const prefersReduced = useReducedMotion();
	const animate = !prefersReduced;

	return (
		<section className="relative" aria-labelledby="lh-process-heading">
			<div className="mb-12 grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
				<div>
					<p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[rgb(var(--accent-bronze-rgb)/0.85)] mb-2">
						What the scan covers
					</p>
					<h2
						id="lh-process-heading"
						className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight text-white leading-[1.1]"
					>
						Five checks. One clear picture of where your site stands.
					</h2>
				</div>
				<p className="text-[0.95rem] leading-[1.65] text-white/55 max-w-md">
					Built for local service businesses that need the next move, not a pile
					of disconnected scores.
				</p>
			</div>

			<ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
				{phases.map((phase, index) => (
					<MotionDiv
						key={phase.num}
						className="relative flex flex-col gap-3 min-h-[10.5rem] rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
						initial={animate ? { opacity: 0, y: 16 } : false}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-40px" }}
						transition={{
							duration: 0.5,
							delay: index * 0.06,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<span className="inline-flex items-center justify-center min-w-[2.4rem] h-[1.65rem] px-2 w-fit rounded-md border border-[rgb(var(--accent-bronze-rgb)/0.25)] bg-[rgb(var(--accent-bronze-rgb)/0.08)] text-[0.7rem] font-bold tracking-[0.06em] text-[rgb(var(--accent-bronze-rgb)/0.95)] font-[family-name:var(--font-fraunces)]">
							{phase.num}
						</span>
						<span className="min-w-0">
							<span className="block font-[family-name:var(--font-display)] text-[15px] font-semibold leading-tight text-white/95">
								{phase.title}
							</span>
							<span className="mt-1.5 block text-[12px] leading-[1.55] text-white/55">
								{phase.body}
							</span>
						</span>
					</MotionDiv>
				))}
			</ol>
		</section>
	);
}
