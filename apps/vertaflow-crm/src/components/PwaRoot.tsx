use client;

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { shouldRegisterServiceWorker } from "@/lib/service-worker-host";

export function PwaRoot({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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