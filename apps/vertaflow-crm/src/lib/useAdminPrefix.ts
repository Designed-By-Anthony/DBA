"use client";

import { useEffect, useState } from "react";

/**
 * On the app/admin subdomain, the proxy rewrites "/" → "/admin"
 * transparently. This hook detects whether we're on the admin subdomain
 * so that internal links can drop the /admin prefix.
 *
 * Supports:
 *   app.designedbyanthony.com    → strips /admin prefix
 *   admin.designedbyanthony.com  → strips /admin prefix (legacy)
 *   localhost:3000               → keeps /admin prefix
 *
 * Usage:
 *   const stripAdmin = useAdminPrefix()
 *   <Link href={stripAdmin("/admin/prospects")}>
 *   // On app subdomain → "/prospects"
 *   // On localhost:3000 → "/admin/prospects"
 */
export function useAdminPrefix() {
	const [isAdminDomain, setIsAdminDomain] = useState(false);

	useEffect(() => {
		const host = window.location.hostname;
		queueMicrotask(() =>
			setIsAdminDomain(
				host.startsWith("app.") ||
					host.startsWith("app-") ||
					host.startsWith("admin.") ||
					host.startsWith("admin-"),
			),
		);
	}, []);

	return (href: string) => {
		if (isAdminDomain && href.startsWith("/admin")) {
			const stripped = href.replace(/^\/admin/, "") || "/";
			return stripped;
		}
		return href;
	};
}
