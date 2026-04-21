"use client";

import { BRAND_ASSETS } from "@dba/theme/brand";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [show, setShow] = useState(false);
	const [isIos, setIsIos] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Already installed as PWA
		if (window.matchMedia("(display-mode: standalone)").matches) {
			queueMicrotask(() => setIsInstalled(true));
			return;
		}

		// Already dismissed
		if (localStorage.getItem("pwa-prompt-dismissed")) return;

		// Detect iOS (Safari)
		const ios =
			/iphone|ipad|ipod/i.test(navigator.userAgent) &&
			!(window as Window & { MSStream?: unknown }).MSStream;
		const safari =
			/safari/i.test(navigator.userAgent) &&
			!/chrome/i.test(navigator.userAgent);
		if (ios && safari) {
			queueMicrotask(() => setIsIos(true));
			// Show iOS instructions after a short delay
			setTimeout(() => setShow(true), 3000);
			return;
		}

		// Android/Chrome install prompt
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setTimeout(() => setShow(true), 3000);
		};
		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") {
			setIsInstalled(true);
		}
		setShow(false);
		setDeferredPrompt(null);
	};

	const handleDismiss = () => {
		setShow(false);
		localStorage.setItem("pwa-prompt-dismissed", "1");
	};

	if (!show || isInstalled) return null;

	return (
		<div
			className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
			style={{ animation: "slideUp 0.3s ease-out" }}
		>
			<style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
			<div className="rounded-2xl border border-glass-border bg-surface-1 p-4 shadow-2xl backdrop-blur-md">
				<div className="flex items-start gap-3">
					{/* App icon */}
					<div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shrink-0 shadow-lg overflow-hidden p-1.5">
						{/* eslint-disable-next-line @next/next/no-img-element -- small inline app icon */}
						<img
							src={BRAND_ASSETS.mark}
							alt=""
							className="w-full h-full object-contain"
						/>
					</div>

					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-white">
							Add to Home Screen
						</p>
						<p className="text-xs text-text-muted mt-0.5">
							{isIos
								? 'Tap the share icon below, then "Add to Home Screen"'
								: "Install the portal app for quick access to your project"}
						</p>

						{!isIos ? (
							<div className="flex gap-2 mt-3">
								<button
									onClick={handleInstall}
									className="flex-1 py-2 rounded-lg bg-(--color-brand) text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
								>
									Install
								</button>
								<button
									onClick={handleDismiss}
									className="px-3 py-2 rounded-lg bg-surface-2 text-text-muted text-xs hover:text-white transition-colors"
								>
									Later
								</button>
							</div>
						) : (
							<div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
								<span>Tap</span>
								<span className="px-1.5 py-0.5 bg-surface-2 rounded text-white">
									⬆️ Share
								</span>
								<span>then</span>
								<span className="px-1.5 py-0.5 bg-surface-2 rounded text-white">
									+ Add
								</span>
							</div>
						)}
					</div>

					<button
						onClick={handleDismiss}
						className="text-text-muted hover:text-white transition-colors shrink-0 text-lg leading-none"
					>
						×
					</button>
				</div>
			</div>
		</div>
	);
}
