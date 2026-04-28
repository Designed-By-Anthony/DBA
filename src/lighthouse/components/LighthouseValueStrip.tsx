"use client";

import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";

const phases = [
	{
		num: "01",
		title: "Lab performance",
		body: "Core Web Vitals, Lighthouse scores, page weight, and render-blocking pressure.",
	},
	{
		num: "02",
		title: "Search structure",
		body: "Metadata, headings, schema hints, indexability, sitemap, and canonical signals.",
	},
	{
		num: "03",
		title: "Trust signals",
		body: "Accessibility, HTTPS posture, local proof, forms, calls to action, and social cues.",
	},
	{
		num: "04",
		title: "Competitive context",
		body: "Places and authority data when available, with graceful fallback when APIs are limited.",
	},
	{
		num: "05",
		title: "Executive readout",
		body: "A prioritized fix list written for decisions, not just developer trivia.",
	},
];

export function LighthouseValueStrip() {
	const prefersReduced = useReducedMotion();
	const animate = !prefersReduced;

	return (
		<section
			className="lh-process relative"
			aria-labelledby="lh-process-heading"
		>
			<div className="lh-process-heading">
				<div>
					<p className="lighthouse-result-eyebrow">Audit coverage</p>
					<h2 id="lh-process-heading" className="lh-process-title">
						The scan reads the page like a buyer and a crawler.
					</h2>
				</div>
				<p className="lh-process-note">
					Built for service businesses that need the next move, not a pile of
					disconnected scores.
				</p>
			</div>

			<ol className="lh-process-grid">
				{phases.map((phase, index) => (
					<MotionDiv
						key={phase.num}
						className="lh-process-step"
						initial={animate ? { opacity: 0, y: 16 } : false}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-40px" }}
						transition={{
							duration: 0.5,
							delay: index * 0.06,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<span className="lh-process-num">{phase.num}</span>
						<span className="min-w-0">
							<span className="block font-report text-[15px] font-semibold leading-tight text-white/96">
								{phase.title}
							</span>
							<span className="mt-1.5 block text-[12px] leading-[1.55] text-white/56">
								{phase.body}
							</span>
						</span>
					</MotionDiv>
				))}
			</ol>
		</section>
	);
}
