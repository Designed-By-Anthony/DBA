use client;

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { shouldRegisterServiceWorker } from "@/lib/service-worker-host";

/**
 * Register only on canonical app hosts. Random Vercel deployment URLs can be
 * deployment-protected, which makes `/serwist/sw.js` return 401 and creates
 * noisy global ServiceWorker registration failures.
 */
export function PwaRoot({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Render children normally on the server without SerwistProvider
	// to prevent 'window is not defined' during static pre-rendering
	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<SerwistProvider
			swUrl="/serwist/sw.js"
			disable={!shouldRegisterServiceWorker()}
		>
			{children}
		</SerwistProvider>
	);
}