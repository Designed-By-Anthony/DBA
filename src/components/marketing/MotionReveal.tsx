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
}

export function MotionStagger({
	children,
	className,
	style,
	staggerDelay = 0.08,
}: MotionStaggerProps) {
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
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<motion.div
			className={className}
			style={style}
			variants={{
				hidden: { opacity: 0, y: 24 },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: 0.6,
						ease: [0.22, 1, 0.36, 1],
					},
				},
			}}
		>
			{children}
		</motion.div>
	);
}
