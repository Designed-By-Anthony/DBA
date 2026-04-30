"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Bumped from `_v1` to `_v2` when splash ownership moved from `HomePage`
 * to the root layout (2026-04). Old v1 flags get ignored so existing
 * visitors still see the splash once under the new global rules.
 */
const STORAGE_KEY = "dba_first_visit_shown_v2";

const MICRO_SAAS_PATH_PREFIXES = ["/tools"] as const;
const MICRO_SAAS_PARAM_KEYS = [
	"ref",
	"source",
	"utm_source",
	"utm_campaign",
	"utm_medium",
	"utm_content",
] as const;
const MICRO_SAAS_PARAM_PATTERN = /micro[-_ ]?saas|microsaas/i;

function isMicroSaasEntry(
	pathname: string | null,
	searchParams: URLSearchParams | null,
): boolean {
	if (pathname) {
		for (const prefix of MICRO_SAAS_PATH_PREFIXES) {
			if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
				return true;
			}
		}
	}
	if (searchParams) {
		for (const key of MICRO_SAAS_PARAM_KEYS) {
			const value = searchParams.get(key);
			if (value && MICRO_SAAS_PARAM_PATTERN.test(value)) {
				return true;
			}
		}
	}
	return false;
}

function safeGetStorage(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSetStorage(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// swallow — private-mode / storage-full / disabled cookies
	}
}

export function FirstVisitSplash() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — evaluates only the initial landing URL on mount; re-running on client nav would re-fire the splash.
	useEffect(() => {
		// Only evaluate once per session (on initial mount). After the first
		// run we persist a flag so subsequent navigations never re-trigger.
		if (safeGetStorage(STORAGE_KEY)) {
			return;
		}

		// Micro-SaaS entry points (e.g. direct /tools landings, or any URL
		// tagged with a micro-saas utm/ref param) must NEVER show the splash,
		// since those visitors are already arriving for that exact offer.
		if (isMicroSaasEntry(pathname, searchParams)) {
			safeSetStorage(STORAGE_KEY, "skipped-microsaas");
			return;
		}

		const timer = window.setTimeout(() => setIsOpen(true), 1500);
		return () => window.clearTimeout(timer);
	}, []);

	const markShown = () => {
		safeSetStorage(STORAGE_KEY, "shown");
	};

	const handleClose = () => {
		markShown();
		setIsOpen(false);
	};

	const handleContactClick = () => {
		markShown();
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
		<div className="fixed inset-0 z-100 flex items-center justify-center p-4">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={handleClose}
				aria-label="Close splash"
			/>

			{/* Modal */}
			<div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgb(var(--accent-bronze-rgb)/0.3)] bg-linear-to-br from-[rgba(18,20,26,0.98)] to-[rgba(10,12,18,0.98)] p-12 md:p-14 shadow-2xl">
				{/* Accent line */}
				<div className="absolute left-0 right-0 top-0 h-[2px] bg-linear-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

				<button
					type="button"
					onClick={handleClose}
					className="absolute right-6 top-6 rounded-full p-2 text-white/50 transition-colors hover:text-white"
					aria-label="Close"
				>
					×
				</button>

				<div className="mb-8">
					<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb)/0.9)]">
						New: Micro SaaS Division
					</p>
					<h2 className="font-display text-3xl font-bold leading-tight text-white">
						Custom web solutions for scaling businesses
					</h2>
				</div>

				<p className="mb-8 text-base leading-relaxed text-white/75 max-w-lg">
					Alongside our Mohawk Valley studio work, we now build bespoke web
					applications and marketing automation systems for businesses ready to
					scale. From custom CRMs to lead generation platforms — if you can
					imagine it, we can build it.
				</p>

				<div className="mb-8 flex flex-wrap gap-3">
					{["Custom Web Apps", "Automation", "API Integrations", "Scaling"].map(
						(tag) => (
							<span
								key={tag}
								className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70"
							>
								{tag}
							</span>
						),
					)}
				</div>

				<div className="flex flex-col gap-4 sm:flex-row">
					<Link
						href="/contact"
						onClick={handleContactClick}
						className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--accent-bronze-rgb)/0.6)] bg-linear-to-b from-[rgb(var(--accent-bronze-light))] to-[rgb(var(--accent-bronze-rgb))] px-8 py-3.5 text-base font-semibold text-[#171008] shadow-lg transition hover:-translate-y-px hover:shadow-xl"
					>
						Contact us →
					</Link>
					<button
						type="button"
						onClick={handleClose}
						className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-white/80 transition hover:bg-white/10"
					>
						Explore the site
					</button>
				</div>
			</div>
		</div>
	);
}
