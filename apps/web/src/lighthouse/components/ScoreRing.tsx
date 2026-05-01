"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
	score: number | null;
	label: string;
	size?: "md" | "lg";
}

export function ScoreRing({ score, label, size = "md" }: ScoreRingProps) {
	const [filled, setFilled] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		const raf = requestAnimationFrame(() =>
			requestAnimationFrame(() => setFilled(true)),
		);
		return () => cancelAnimationFrame(raf);
	}, []);

	const isLg = size === "lg";
	const radius = isLg ? 46 : 36;
	const strokeWidth = isLg ? 6 : 5.5;
	const svgSize = isLg ? 104 : 80;
	const cx = svgSize / 2;
	const circumference = 2 * Math.PI * radius;

	const pct = score == null ? 0 : Math.min(100, Math.max(0, score));
	const targetOffset = circumference - (pct / 100) * circumference;
	const strokeDashoffset = filled ? targetOffset : circumference;

	let toneClass = "lighthouse-score-card--red";
	let colorVar = "rgba(248, 113, 113, 0.9)";
	let glowClass = "score-glow-red";
	if (score == null) {
		toneClass = "lighthouse-score-card--null";
		colorVar = "rgba(255, 255, 255, 0.28)";
		glowClass = "";
	} else if (score >= 90) {
		toneClass = "lighthouse-score-card--green";
		colorVar = "rgba(74, 222, 128, 0.95)";
		glowClass = "score-glow-green";
	} else if (score >= 50) {
		toneClass = "lighthouse-score-card--amber";
		colorVar = "rgba(251, 191, 36, 0.95)";
		glowClass = "score-glow-amber";
	}

	const titleText =
		score == null ? `${label}: not available` : `${label}: ${score} out of 100`;

	return (
		<figure
			className={`lighthouse-score-card ${toneClass} ${glowClass}${isLg ? " lighthouse-score-card--lg" : ""}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			aria-label={titleText}
			data-hovered={isHovered ? "true" : "false"}
		>
			<div className="lighthouse-score-ring">
				<svg
					className="lighthouse-score-svg"
					viewBox={`0 0 ${svgSize} ${svgSize}`}
					aria-hidden="true"
					role="img"
				>
					<title>{titleText}</title>
					<circle
						cx={cx}
						cy={cx}
						r={radius}
						stroke="rgba(255,255,255,0.07)"
						strokeWidth={strokeWidth}
						fill="transparent"
					/>
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
							data-filled={filled ? "true" : "false"}
						/>
					)}
				</svg>
				<span
					className="lighthouse-score-value"
					style={{ color: colorVar }}
					aria-hidden="true"
				>
					{score == null ? "—" : score}
				</span>
			</div>
			<span className="lighthouse-score-label">{label}</span>
		</figure>
	);
}
