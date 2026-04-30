"use client";

import {
	hasConsentDecision,
	readStoredConsent,
	writeConsent,
} from "@lh/lib/cookieConsent";
import { useState, useSyncExternalStore } from "react";

const PRIVACY_URL = "https://designedbyanthony.com/privacy";

const emptySubscribe = () => () => {};

export function CookieConsentBanner() {
	const isClient = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	const [settingsOpen, setSettingsOpen] = useState(false);

	if (!isClient) {
		return null;
	}

	const needsPrompt = !hasConsentDecision();
	const panelOpen = needsPrompt || settingsOpen;

	const apply = (analytics: boolean) => {
		writeConsent(analytics);
		window.location.reload();
	};

	if (!panelOpen) {
		return (
			<div className="fixed bottom-3 left-3 z-100 print:hidden">
				<button
					type="button"
					onClick={() => setSettingsOpen(true)}
					className="rounded-full bg-[rgba(8,12,20,0.78)] px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-[rgba(8,12,20,0.92)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-bronze-rgb)/0.7)]"
				>
					Cookie settings
				</button>
			</div>
		);
	}

	const existing = readStoredConsent();

	return (
		<div
			className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex justify-center p-4 sm:p-6 print:hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby="cookie-consent-title"
		>
			{/* Phase-3 follow-up: re-skinned to brand bronze (was off-brand
			    blue gradient). Buttons now meet WCAG 4.5:1 contrast on the
			    glass-card background. */}
			<div className="cookie-consent-card pointer-events-auto w-full max-w-lg rounded-[1.25rem] border border-[rgb(var(--accent-bronze-rgb)/0.32)] bg-[rgba(10,14,22,0.96)] p-6 shadow-2xl backdrop-blur-xl">
				<h2
					id="cookie-consent-title"
					className="mb-2 font-display text-lg font-semibold text-white"
				>
					Cookies &amp; privacy
				</h2>
				<p className="mb-4 text-sm leading-relaxed text-white/85">
					We use essential storage so the audit tool works. With your
					permission, we also use analytics and error monitoring to improve
					reliability (no third-party ad cookies).
				</p>
				<p className="mb-4 text-xs text-white/70">
					Read our{" "}
					<a
						href={PRIVACY_URL}
						target="_blank"
						rel="noreferrer"
						className="text-(--accent-bronze-light) underline underline-offset-2 hover:text-white"
					>
						privacy policy
					</a>
					.
				</p>
				{existing ? (
					<p className="mb-3 text-xs text-white/65">
						Current choice:{" "}
						<span className="text-white/85">
							{existing.analytics ? "All accepted" : "Essential only"}
						</span>
					</p>
				) : null}
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={() => apply(false)}
						className="order-2 inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e16] sm:order-1"
					>
						Essential only
					</button>
					<button
						type="button"
						onClick={() => apply(true)}
						className="order-1 inline-flex items-center justify-center rounded-xl bg-(--accent-bronze-light) px-6 py-2.5 text-sm font-bold text-[#171008] ring-1 ring-[rgb(var(--accent-bronze-rgb)/0.7)] shadow-[0_18px_40px_-18px_var(--accent-bronze-glow)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/85 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e16] sm:order-2"
					>
						Accept all
					</button>
				</div>
				{existing ? (
					<button
						type="button"
						onClick={() => setSettingsOpen(false)}
						className="mt-4 text-xs text-white/65 underline underline-offset-2 hover:text-white"
					>
						Close
					</button>
				) : null}
			</div>
		</div>
	);
}
