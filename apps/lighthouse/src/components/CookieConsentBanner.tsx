"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
	hasConsentDecision,
	readStoredConsent,
	writeConsent,
} from "@/lib/cookieConsent";

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
			<div className="fixed bottom-3 left-3 z-100">
				<button
					type="button"
					onClick={() => setSettingsOpen(true)}
					className="text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.75)] underline underline-offset-2 transition-colors"
				>
					Cookie settings
				</button>
			</div>
		);
	}

	const existing = readStoredConsent();

	return (
		<div
			className="fixed inset-x-0 bottom-0 z-100 p-4 sm:p-6 flex justify-center pointer-events-none"
			role="dialog"
			aria-modal="true"
			aria-labelledby="cookie-consent-title"
		>
			<div className="pointer-events-auto w-full max-w-lg glass-card p-5 sm:p-6 shadow-2xl border border-[rgba(96,165,250,0.2)]">
				<h2
					id="cookie-consent-title"
					className="font-display text-lg font-medium text-foreground mb-2"
				>
					Cookies &amp; privacy
				</h2>
				<p className="text-sm text-[rgba(248,250,252,0.78)] leading-relaxed mb-4">
					We use essential storage so the audit tool works. With your
					permission, we also use analytics and error monitoring to improve
					reliability (no third-party ad cookies).
				</p>
				<p className="text-xs text-[rgba(248,250,252,0.55)] mb-4">
					Read our{" "}
					<a
						href={PRIVACY_URL}
						target="_blank"
						rel="noreferrer"
						className="text-primary hover:underline"
					>
						privacy policy
					</a>
					.
				</p>
				{existing ? (
					<p className="text-xs text-[rgba(248,250,252,0.5)] mb-3">
						Current choice:{" "}
						<span className="text-[rgba(248,250,252,0.75)]">
							{existing.analytics ? "All accepted" : "Essential only"}
						</span>
					</p>
				) : null}
				<div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
					<button
						type="button"
						onClick={() => apply(false)}
						className="order-2 sm:order-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-foreground transition-colors"
					>
						Essential only
					</button>
					<button
						type="button"
						onClick={() => apply(true)}
						className="order-1 sm:order-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
						style={{
							background:
								"linear-gradient(135deg, rgba(96, 165, 250, 0.34), rgba(37, 99, 235, 1))",
							border: "1px solid rgba(96, 165, 250, 0.55)",
						}}
					>
						Accept all
					</button>
				</div>
				{existing ? (
					<button
						type="button"
						onClick={() => setSettingsOpen(false)}
						className="mt-4 text-xs text-[rgba(248,250,252,0.45)] hover:text-[rgba(248,250,252,0.7)]"
					>
						Close
					</button>
				) : null}
			</div>
		</div>
	);
}
