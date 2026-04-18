"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminPrefix } from "@/lib/useAdminPrefix";
import {
  Building2,
  Palette,
  GitBranch,
  Bell,
  Users,
  ListChecks,
  Layers,
  Globe2,
} from "lucide-react";

const sections = [
  { id: "general", label: "General", href: "/admin/settings", icon: Building2 },
  { id: "branding", label: "Branding", href: "/admin/settings/branding", icon: Palette },
  { id: "pipeline", label: "Pipeline", href: "/admin/settings/pipeline", icon: GitBranch },
  { id: "sources", label: "Deal Sources", href: "/admin/settings/sources", icon: ListChecks },
  { id: "notifications", label: "Notifications", href: "/admin/settings/notifications", icon: Bell },
  { id: "domains", label: "Domains", href: "/admin/settings/domains", icon: Globe2 },
  { id: "vertical", label: "Vertical", href: "/admin/settings/vertical", icon: Layers },
  { id: "team", label: "Team", href: "/admin/settings/team", icon: Users },
  { id: "business", label: "Business Rules", href: "/admin/settings/business", icon: Building2 },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const stripAdmin = useAdminPrefix();

  const isActive = (href: string) => {
    const norm = href.replace(/^\/admin/, "") || "/";
    const curr = pathname.replace(/^\/admin/, "") || "/";
    if (norm === "/settings") return curr === "/settings";
    return curr.startsWith(norm);
  };

  return (
    <div className="flex gap-0 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      {/* Left-nav settings sidebar */}
      <nav className="w-56 shrink-0 border-r border-glass-border bg-surface-1/50 py-6 px-3 space-y-1 hidden md:block">
        <h2 className="text-xs font-bold text-text-gray uppercase tracking-wider px-3 mb-4">
          Settings
        </h2>
        {sections.map((s) => {
          const Icon = s.icon;
          const active = isActive(s.href);
          return (
            <Link
              key={s.id}
              href={stripAdmin(s.href)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? "bg-brand-subtle text-white font-medium"
                  : "text-text-gray hover:text-white hover:bg-surface-3"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-(--color-brand)" : "text-text-gray"}
              />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings content */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
