"use client";

import { BRAND_ASSETS } from "@dba/theme/brand";
import { RefreshCw, WifiOff } from "lucide-react";
import Image from "next/image";

export default function OfflinePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-(--color-surface-0) text-white p-6 text-center relative overflow-hidden">
			{/* Decorative orbs */}
			<div className="orb w-[400px] h-[400px] bg-[rgb(59_130_246/0.06)] -top-32 -right-32" />
			<div className="orb w-[300px] h-[300px] bg-[hsl(221_70%_55%/0.04)] -bottom-20 -left-20" />

			{/* Logo mark */}
			<div className="relative w-[120px] h-[90px] mb-8 shadow-[0_12px_48px_rgb(59_130_246/0.25)] animate-scale-in">
				<Image
					src={BRAND_ASSETS.logo}
					alt="Designed by Anthony"
					width={240}
					height={180}
					className="w-full h-full object-contain"
					priority
				/>
			</div>

			{/* Wifi off icon */}
			<div className="w-14 h-14 rounded-xl bg-surface-2 border border-glass-border flex items-center justify-center mb-6 animate-fade-up stagger-1">
				<WifiOff size={24} className="text-text-muted" />
			</div>

			<h1 className="text-xl font-bold mb-3 animate-fade-up stagger-2">
				You&apos;re Offline
			</h1>

			<p className="text-text-muted text-sm max-w-[280px] leading-relaxed mb-8 animate-fade-up stagger-3">
				No internet connection detected. Your portal will reload automatically
				when you&apos;re back online.
			</p>

			<button
				onClick={() => window.location.reload()}
				className="inline-flex items-center gap-2 bg-(--color-brand) hover:bg-brand-hover text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-(--color-brand-glow) hover:-translate-y-0.5 animate-fade-up stagger-4"
			>
				<RefreshCw size={16} />
				Try Again
			</button>

			<p className="text-text-muted text-[11px] mt-12 opacity-60 animate-fade-in">
				Designed by Anthony · Client Portal
			</p>
		</div>
	);
}
