"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dba_first_visit_shown_v1";

export function FirstVisitSplash() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		// Check if already shown
		const hasShown = localStorage.getItem(STORAGE_KEY);
		if (!hasShown) {
			// Show after short delay for better UX
			const timer = setTimeout(() => setIsOpen(true), 1500);
			return () => clearTimeout(timer);
		}
	}, []);

	const handleClose = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setIsOpen(false);
	};

	const handleContactClick = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		// Track the CTA
		if (typeof window !== "undefined") {
			const w = window as unknown as { dataLayer?: unknown[] };
			w.dataLayer?.push({
				event: "first_visit_splash_contact",
				cta_source: "first_visit_splash",
			});
		}
		setIsOpen(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={handleClose}
				aria-label="Close splash"
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[rgb(var(--accent-bronze-rgb)/0.3)] bg-gradient-to-br from-[rgba(18,20,26,0.98)] to-[rgba(10,12,18,0.98)] p-8 shadow-2xl">
				{/* Accent line */}
				<div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

				<button
					type="button"
					onClick={handleClose}
					className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition-colors hover:text-white"
					aria-label="Close"
				>
					×
				</button>

				<div className="mb-6">
					<p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb)/0.9)]">
						New: Micro SaaS Division
					</p>
					<h2 className="font-display text-2xl font-bold leading-tight text-white">
						Custom web solutions for scaling businesses
					</h2>
				</div>

				<p className="mb-6 text-[15px] leading-relaxed text-white/75">
					Alongside our Mohawk Valley studio work, we now build bespoke web
					applications and marketing automation systems for businesses ready to
					scale. From custom CRMs to lead generation platforms — if you can
					imagine it, we can build it.
				</p>

				<div className="mb-6 flex flex-wrap gap-2">
					{["Custom Web Apps", "Automation", "API Integrations", "Scaling"].map(
						(tag) => (
							<span
								key={tag}
								className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
							>
								{tag}
							</span>
						),
					)}
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						href="/contact"
						onClick={handleContactClick}
						className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--accent-bronze-rgb)/0.6)] bg-gradient-to-b from-[rgb(var(--accent-bronze-light))] to-[rgb(var(--accent-bronze-rgb))] px-6 py-3 text-sm font-semibold text-[#171008] shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl"
					>
						Contact us →
					</Link>
					<button
						type="button"
						onClick={handleClose}
						className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
					>
						Explore the site
					</button>
				</div>
			</div>
		</div>
	);
}
