"use client";

import {
	Calendar,
	LayoutDashboard,
	Mail,
	MoreHorizontal,
	ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
	{ href: "/admin", label: "Home", icon: LayoutDashboard },
	{ href: "/admin/pos", label: "POS", icon: ShoppingCart },
	{ href: "/admin/calendar", label: "Calendar", icon: Calendar },
	{ href: "/admin/inbox", label: "Inbox", icon: Mail },
	{ href: "/admin/settings", label: "More", icon: MoreHorizontal },
];

export default function MobileBottomNav() {
	const pathname = usePathname();

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-glass-border)] md:hidden safe-area-bottom"
			style={{
				background: "var(--color-surface-0)",
				backdropFilter: "blur(20px)",
			}}
		>
			<div className="flex items-center justify-around h-16 px-2">
				{NAV_ITEMS.map((item) => {
					const active =
						pathname === item.href ||
						(item.href !== "/admin" && pathname.startsWith(item.href));
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
								active
									? "text-[var(--color-brand)]"
									: "text-[var(--color-text-muted)]"
							}`}
						>
							<Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
							<span className="text-[10px] font-medium">{item.label}</span>
						</Link>
					);
				})}
			</div>

			<style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
		</nav>
	);
}
