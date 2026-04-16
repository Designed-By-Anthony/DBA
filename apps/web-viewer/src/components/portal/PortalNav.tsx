"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket } from "lucide-react";

const tabs = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/portal/tickets", icon: Ticket },
];

export default function PortalNav() {
  const pathname = usePathname();

  // Only show on authenticated portal pages
  const isPortalPage = pathname.startsWith("/portal/dashboard") || pathname.startsWith("/portal/tickets");
  if (!isPortalPage) return null;

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              active
                ? "bg-[var(--color-brand-subtle)] text-white font-medium"
                : "text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-3)]"
            }`}
          >
            <Icon size={15} className={active ? "text-[var(--color-brand)]" : ""} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
