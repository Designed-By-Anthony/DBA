"use client";

import { startTransition, useLayoutEffect, useState } from "react";
import QuickAddLead from "@/components/ui/QuickAddLead";
import { VerticalProvider } from "@/lib/VerticalContext";
import MobileBottomNav from "./MobileBottomNav";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export default function DashboardShell({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	/** Must match server render (false); hydrate preference after mount to avoid React #418. */
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useLayoutEffect(() => {
		try {
			const fromStorage =
				localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
			startTransition(() => setCollapsed(fromStorage));
		} catch {
			/* private mode / no storage */
		}
	}, []);

	const handleToggle = () => {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
			} catch {
				/* ignore */
			}
			return next;
		});
	};

	return (
		<VerticalProvider>
			<div className="min-h-screen bg-[var(--color-surface-0)]">
				<Sidebar
					collapsed={collapsed}
					onToggle={handleToggle}
					onMobileClose={() => setMobileOpen(false)}
					isMobileOpen={mobileOpen}
				/>

				<div
					className={`
            transition-all duration-300 ease-out
            ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}
          `}
				>
					<TopBar onMenuClick={() => setMobileOpen(true)} title={title} />

					<main className="p-6 pb-24 md:pb-6 page-enter">{children}</main>

					<QuickAddLead />
					<MobileBottomNav />
				</div>
			</div>
		</VerticalProvider>
	);
}
