"use client";

import { useEffect } from "react";

const SCRIPT_ID = "crisp-client-script";
const DEFAULT_WEBSITE_ID = "427bf1d5-f2a9-408b-8cc6-0efc6489c676";

declare global {
	interface Window {
		$crisp?: unknown[];
		CRISP_WEBSITE_ID?: string;
		CRISP_RUNTIME_CONFIG?: { locale?: string };
		__dbaCrispLoaded?: boolean;
	}
}

/**
 * Crisp chat — sole canonical chat widget. Defers script load until the first
 * user interaction (pointerdown/keydown) or a 6 s fallback timer so it never
 * costs LCP. Website ID is overridable via `NEXT_PUBLIC_CRISP_WEBSITE_ID`.
 */
export function CrispBootstrap() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.__dbaCrispLoaded) return;

		const websiteId =
			process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || DEFAULT_WEBSITE_ID;

		const load = () => {
			if (window.__dbaCrispLoaded) return;
			window.__dbaCrispLoaded = true;
			window.$crisp = window.$crisp ?? [];
			window.CRISP_RUNTIME_CONFIG = {
				...(window.CRISP_RUNTIME_CONFIG ?? {}),
				locale: "en",
			};
			window.CRISP_WEBSITE_ID = websiteId;
			if (document.getElementById(SCRIPT_ID)) return;
			const s = document.createElement("script");
			s.id = SCRIPT_ID;
			s.src = "https://client.crisp.chat/l.js";
			s.async = true;
			(document.head ?? document.documentElement).appendChild(s);
		};

		const kickoff = () => {
			load();
			window.removeEventListener("pointerdown", kickoff);
			window.removeEventListener("keydown", kickoff);
		};

		window.addEventListener("pointerdown", kickoff, {
			once: true,
			passive: true,
		});
		window.addEventListener("keydown", kickoff, { once: true });
		const timer = window.setTimeout(load, 6000);

		return () => {
			window.clearTimeout(timer);
			window.removeEventListener("pointerdown", kickoff);
			window.removeEventListener("keydown", kickoff);
		};
	}, []);

	return null;
}
