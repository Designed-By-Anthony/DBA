"use client";

import { useReducedMotion } from "framer-motion";
import {
	article as MotionArticle,
	details as MotionDetails,
	div as MotionDiv,
	li as MotionLi,
	ul as MotionUl,
} from "framer-motion/client";
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
		<MotionDiv
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
		</MotionDiv>
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
			<MotionUl
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
			</MotionUl>
		);
	}

	return (
		<MotionDiv
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
		</MotionDiv>
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
			<MotionLi className={className} style={style} variants={variants}>
				{children}
			</MotionLi>
		);
	}
	if (as === "article") {
		return (
			<MotionArticle className={className} style={style} variants={variants}>
				{children}
			</MotionArticle>
		);
	}
	if (as === "details") {
		return (
			<MotionDetails className={className} style={style} variants={variants}>
				{children}
			</MotionDetails>
		);
	}
	return (
		<MotionDiv className={className} style={style} variants={variants}>
			{children}
		</MotionDiv>
	);
}
