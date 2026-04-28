"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreRingProps {
	score: number | null;
	label: string;
	size?: "md" | "lg";
}

export function ScoreRing({ score, label, size = "md" }: ScoreRingProps) {
	const [filled, setFilled] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	useEffect(() => {
		if (prefersReducedMotion) {
			setFilled(true);
			return;
		}
		const raf = requestAnimationFrame(() =>
			requestAnimationFrame(() => setFilled(true)),
		);
		return () => cancelAnimationFrame(raf);
	}, [prefersReducedMotion]);

	const isLg = size === "lg";
	const radius = isLg ? 46 : 36;
	const strokeWidth = isLg ? 6 : 5.5;
	const svgSize = isLg ? 104 : 80;
	const cx = svgSize / 2;
	const circumference = 2 * Math.PI * radius;

	const pct = score == null ? 0 : Math.min(100, Math.max(0, score));
	const targetOffset = circumference - (pct / 100) * circumference;
	const strokeDashoffset = filled ? targetOffset : circumference;

	let colorVar = "rgba(248,113,113,0.9)";
	let glowClass = "score-glow-red";
	let textColor = "#f87171";
	if (score == null) {
		colorVar = "rgba(255,255,255,0.28)";
		glowClass = "";
		textColor = "rgba(255,255,255,0.28)";
	} else if (score >= 90) {
		colorVar = "rgba(74,222,128,0.95)";
		glowClass = "score-glow-green";
		textColor = "#4ade80";
	} else if (score >= 50) {
		colorVar = "rgba(251,191,36,0.95)";
		glowClass = "score-glow-amber";
		textColor = "#fbbf24";
	}

	const wrapSize = isLg ? "h-[104px] w-[104px]" : "h-[80px] w-[80px]";
	const scoreSize = isLg ? "text-[1.75rem]" : "text-[1.35rem]";
	const titleText =
		score == null ? `${label}: not available` : `${label}: ${score} out of 100`;

	return (
		<figure
			className={`lighthouse-score-card ${glowClass} flex flex-col items-center gap-2.5`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			aria-label={titleText}
			style={{
				transform: isHovered ? "translateY(-4px) scale(1.02)" : undefined,
				transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
			}}
		>
			<div className={`relative flex items-center justify-center ${wrapSize}`}>
				<svg
					className="h-full w-full -rotate-90 transform"
					viewBox={`0 0 ${svgSize} ${svgSize}`}
					aria-hidden="true"
					role="img"
				>
					<title>{titleText}</title>
					{/* Track */}
					<circle
						cx={cx}
						cy={cx}
						r={radius}
						stroke="rgba(255,255,255,0.07)"
						strokeWidth={strokeWidth}
						fill="transparent"
					/>
					{/* Progress */}
					{score != null && (
						<circle
							cx={cx}
							cy={cx}
							r={radius}
							stroke={colorVar}
							strokeWidth={strokeWidth}
							fill="transparent"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="round"
							style={{
								transition: filled
									? "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)"
									: "none",
								filter: isHovered
									? `drop-shadow(0 0 12px ${colorVar})`
									: `drop-shadow(0 0 6px ${colorVar})`,
							}}
						/>
					)}
				</svg>
				{/* Center number — aria-label is on the SVG title above */}
				<span
					className={`absolute font-display font-semibold leading-none ${scoreSize}`}
					style={{ color: textColor }}
					aria-hidden="true"
				>
					{score == null ? "—" : score}
				</span>
			</div>
			<span className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 px-1">
				{label}
			</span>
		</figure>
	);
}
