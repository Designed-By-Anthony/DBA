"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

interface MotionRevealProps {
	children: ReactNode;
	delay?: number;
	y?: number;
	duration?: number;
	className?: string;
	style?: CSSProperties;
	once?: boolean;
}

export function MotionReveal({
	children,
	delay = 0,
	y = 32,
	duration = 0.7,
	className,
	style,
	once = true,
}: MotionRevealProps) {
	const prefersReduced = useReducedMotion();

	if (prefersReduced) {
		return (
			<div className={className} style={style}>
				{children}
			</div>
		);
	}

	return (
		<motion.div
			className={className}
			style={style}
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once, margin: "-60px" }}
			transition={{
				duration,
				delay,
				ease: [0.22, 1, 0.36, 1],
			}}
		>
			{children}
		</motion.div>
	);
}

interface MotionStaggerProps {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	staggerDelay?: number;
	as?: "div" | "ul";
	"data-exclusive-details"?: boolean;
}

export function MotionStagger({
	children,
	className,
	style,
	staggerDelay = 0.08,
	as = "div",
	"data-exclusive-details": exclusiveDetails,
}: MotionStaggerProps) {
	const prefersReduced = useReducedMotion();

	if (prefersReduced) {
		if (as === "ul") {
			return (
				<ul
					className={className}
					style={style}
					data-exclusive-details={exclusiveDetails}
				>
					{children}
				</ul>
			);
		}

		return (
			<div
				className={className}
				style={style}
				data-exclusive-details={exclusiveDetails}
			>
				{children}
			</div>
		);
	}

	if (as === "ul") {
		return (
			<motion.ul
				className={className}
				style={style}
				data-exclusive-details={exclusiveDetails}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-40px" }}
				variants={{
					visible: {
						transition: { staggerChildren: staggerDelay },
					},
				}}
			>
				{children}
			</motion.ul>
		);
	}

	return (
		<motion.div
			className={className}
			style={style}
			data-exclusive-details={exclusiveDetails}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-40px" }}
			variants={{
				visible: {
					transition: { staggerChildren: staggerDelay },
				},
			}}
		>
			{children}
		</motion.div>
	);
}

export function MotionStaggerChild({
	children,
	className,
	style,
	as = "div",
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	as?: "div" | "li" | "article" | "details";
}) {
	const prefersReduced = useReducedMotion();
	const variants = {
		hidden: { opacity: 0, y: 24 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
				ease: [0.22, 1, 0.36, 1],
			},
		},
	} as const;

	if (prefersReduced) {
		if (as === "li") {
			return (
				<li className={className} style={style}>
					{children}
				</li>
			);
		}
		if (as === "article") {
			return (
				<article className={className} style={style}>
					{children}
				</article>
			);
		}
		if (as === "details") {
			return (
				<details className={className} style={style}>
					{children}
				</details>
			);
		}
		return (
			<div className={className} style={style}>
				{children}
			</div>
		);
	}

	if (as === "li") {
		return (
			<motion.li className={className} style={style} variants={variants}>
				{children}
			</motion.li>
		);
	}
	if (as === "article") {
		return (
			<motion.article className={className} style={style} variants={variants}>
				{children}
			</motion.article>
		);
	}
	if (as === "details") {
		return (
			<motion.details className={className} style={style} variants={variants}>
				{children}
			</motion.details>
		);
	}
	return (
		<motion.div className={className} style={style} variants={variants}>
			{children}
		</motion.div>
	);
}
