"use client";

import Script from "next/script";

const DEFAULT_WEBSITE_ID = "427bf1d5-f2a9-408b-8cc6-0efc6489c676";

declare global {
	interface Window {
		$crisp?: unknown[];
		CRISP_WEBSITE_ID?: string;
		CRISP_RUNTIME_CONFIG?: { locale?: string };
	}
}

/**
 * Crisp chat — Phase 4 SEV-2 hardening.
 *
 * Uses next/script with strategy="lazyOnload" to defer the third-party
 * widget until the browser is idle. Restores the perf gate that was
 * dropped during the 2026 launch push — the previous implementation
 * used document.createElement("script") inside a useEffect, which
 * forced immediate load and competed with LCP.
 *
 * lazyOnload runs after the page becomes interactive AND idle, so the
 * Crisp widget visibly mounts a beat or two later than the rest of
 * the chrome — this is intentional.
 */
export function CrispBootstrap() {
	const websiteId =
		process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || DEFAULT_WEBSITE_ID;

	return (
		<>
			<Script id="crisp-config" strategy="lazyOnload">
				{`window.$crisp=window.$crisp||[];window.CRISP_WEBSITE_ID="${websiteId}";window.CRISP_RUNTIME_CONFIG=Object.assign({locale:"en"},window.CRISP_RUNTIME_CONFIG||{});`}
			</Script>
			<Script
				src="https://client.crisp.chat/l.js"
				strategy="lazyOnload"
				id="crisp-client-script"
			/>
		</>
	);
}
