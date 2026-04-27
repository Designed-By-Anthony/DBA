"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageLifecycle() {
	const pathname = usePathname();

	useEffect(() => {
		window.dispatchEvent(
			new CustomEvent("dba:page-ready", {
				detail: { pathname },
			}),
		);
	}, [pathname]);

	return null;
}
