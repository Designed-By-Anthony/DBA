"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, useState } from "react";

/**
 * Vercel Web Analytics resolves its script to an absolute URL on `*.vercel.app`.
 * On a custom domain, the SDK may request a relative `/…/script.js`, which
 * returns HTML (404) unless Web Analytics is enabled *and* you opt in here.
 */
function shouldEnableObservability(hostname: string) {
	if (process.env.NODE_ENV !== "production") return false;
	const onVercelHost =
		hostname === "dba-agency-os.vercel.app" || hostname.endsWith(".vercel.app");
	const optedIn = process.env.NEXT_PUBLIC_VERCEL_WEB_ANALYTICS === "1";
	return onVercelHost || optedIn;
}

export function VercelObservability() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => {
			setEnabled(shouldEnableObservability(window.location.hostname));
		});
		return () => window.cancelAnimationFrame(frame);
	}, []);

	if (!enabled) return null;

	return (
		<>
			<Analytics />
			<SpeedInsights />
		</>
	);
}
