"use client";

import { useCallback, useEffect, useRef } from "react";

interface Orb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	hue: number;
	saturation: number;
	lightness: number;
	alpha: number;
	phase: number;
	speed: number;
}

const ORB_COUNT = 5;
const MOUSE_INFLUENCE = 0.08;

function createOrbs(w: number, h: number): Orb[] {
	return Array.from({ length: ORB_COUNT }, (_, i) => ({
		x: Math.random() * w,
		y: Math.random() * h,
		vx: (Math.random() - 0.5) * 0.3,
		vy: (Math.random() - 0.5) * 0.3,
		radius: Math.min(w, h) * (0.18 + Math.random() * 0.22),
		hue: 215 + i * 12,
		saturation: 65 + Math.random() * 20,
		lightness: 45 + Math.random() * 15,
		alpha: 0.06 + Math.random() * 0.04,
		phase: Math.random() * Math.PI * 2,
		speed: 0.0004 + Math.random() * 0.0003,
	}));
}

export function HeroCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });
	const orbsRef = useRef<Orb[]>([]);
	const rafRef = useRef<number>(0);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		mouseRef.current = {
			x: (e.clientX - rect.left) / rect.width,
			y: (e.clientY - rect.top) / rect.height,
			active: true,
		};
	}, []);

	const handleMouseLeave = useCallback(() => {
		mouseRef.current.active = false;
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let w = 0;
		let h = 0;

		function resize() {
			if (!canvas) return;
			const dpr = Math.min(window.devicePixelRatio, 2);
			const rect = canvas.getBoundingClientRect();
			w = rect.width;
			h = rect.height;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx?.scale(dpr, dpr);
			if (orbsRef.current.length === 0) {
				orbsRef.current = createOrbs(w, h);
			}
		}

		resize();
		window.addEventListener("resize", resize);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseleave", handleMouseLeave);

		function animate() {
			if (!ctx) return;
			ctx.clearRect(0, 0, w, h);

			const mouse = mouseRef.current;

			for (const orb of orbsRef.current) {
				orb.phase += orb.speed;
				orb.x += orb.vx + Math.sin(orb.phase) * 0.15;
				orb.y += orb.vy + Math.cos(orb.phase * 0.7) * 0.12;

				if (mouse.active) {
					const mx = mouse.x * w;
					const my = mouse.y * h;
					const dx = mx - orb.x;
					const dy = my - orb.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < orb.radius * 2.5) {
						orb.x += dx * MOUSE_INFLUENCE * 0.02;
						orb.y += dy * MOUSE_INFLUENCE * 0.02;
					}
				}

				if (orb.x < -orb.radius) orb.x = w + orb.radius;
				if (orb.x > w + orb.radius) orb.x = -orb.radius;
				if (orb.y < -orb.radius) orb.y = h + orb.radius;
				if (orb.y > h + orb.radius) orb.y = -orb.radius;

				const pulseFactor = 1 + Math.sin(orb.phase * 2) * 0.08;
				const r = orb.radius * pulseFactor;

				const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
				grad.addColorStop(
					0,
					`hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${orb.alpha * 1.4})`,
				);
				grad.addColorStop(
					0.4,
					`hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${orb.alpha * 0.6})`,
				);
				grad.addColorStop(
					1,
					`hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, 0)`,
				);

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
				ctx.fill();
			}

			const connectionAlpha = 0.015 + (mouse.active ? 0.01 : 0);
			ctx.strokeStyle = `rgba(147, 197, 253, ${connectionAlpha})`;
			ctx.lineWidth = 0.5;
			const orbs = orbsRef.current;
			for (let i = 0; i < orbs.length; i++) {
				for (let j = i + 1; j < orbs.length; j++) {
					const dx = orbs[i].x - orbs[j].x;
					const dy = orbs[i].y - orbs[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					const maxDist = Math.min(w, h) * 0.5;
					if (dist < maxDist) {
						const fade = 1 - dist / maxDist;
						ctx.globalAlpha = fade;
						ctx.beginPath();
						ctx.moveTo(orbs[i].x, orbs[i].y);
						ctx.lineTo(orbs[j].x, orbs[j].y);
						ctx.stroke();
					}
				}
			}
			ctx.globalAlpha = 1;

			rafRef.current = requestAnimationFrame(animate);
		}

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("resize", resize);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [handleMouseMove, handleMouseLeave]);

	return (
		<canvas
			ref={canvasRef}
			className="hero-canvas"
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "auto",
				zIndex: 0,
				opacity: 0.85,
			}}
		/>
	);
}
