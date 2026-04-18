"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useOrganization } from "@clerk/nextjs";
import { useAdminPrefix } from "@/lib/useAdminPrefix";
import { useVertical } from "@/lib/VerticalContext";
import { filterSidebarForPlanSuite } from "@/lib/org-entitlements";
import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { BRAND_ASSETS } from "@dba/theme/brand";


export default function Sidebar({
  collapsed,
  onToggle,
  onMobileClose,
  isMobileOpen,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  isMobileOpen: boolean;
}) {
  const pathname = usePathname();
  const stripAdmin = useAdminPrefix();
  const { organization } = useOrganization();
  const { vertical, planSuite } = useVertical();
  const orgName = organization?.name || "Designed by Anthony";
  const navItems = filterSidebarForPlanSuite(vertical.sidebarItems, planSuite);

  const isActive = (href: string) => {
    // Match against the actual pathname (which may or may not have /admin)
    const normalizedHref = href.replace(/^\/admin/, "") || "/";
    const normalizedPath = pathname.replace(/^\/admin/, "") || "/";
    if (normalizedHref === "/") return normalizedPath === "/";
    if (normalizedHref === "/email") return normalizedPath === "/email";
    if (normalizedHref === "/email/history") return normalizedPath === "/email/history";
    if (normalizedHref === "/automations") return normalizedPath === "/automations";
    if (normalizedHref === "/inbox") return normalizedPath === "/inbox";
    // /settings is a prefix of /settings/business — only one nav item should be active.
    if (normalizedHref === "/settings/business") {
      return (
        normalizedPath === "/settings/business" ||
        normalizedPath.startsWith("/settings/business/")
      );
    }
    if (normalizedHref === "/settings") {
      if (normalizedPath === "/settings") return true;
      if (!normalizedPath.startsWith("/settings/")) return false;
      return !normalizedPath.startsWith("/settings/business");
    }
    return normalizedPath.startsWith(normalizedHref);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-surface-1 border-r border-glass-border
          transition-all duration-300 ease-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo / Brand */}
        <button onClick={onToggle} className="h-16 flex w-full items-center px-5 border-b border-glass-border shrink-0 hover:bg-surface-2 transition-colors text-left focus:outline-none">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={BRAND_ASSETS.mark}
                alt=""
                width={36}
                height={27}
                className="h-7 w-auto shrink-0 object-contain"
                priority
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{orgName}</p>
                <p className="text-[11px] text-text-muted truncate">Agency OS</p>
              </div>
            </div>
          )}
          {collapsed && (
            <Image
              src={BRAND_ASSETS.mark}
              alt=""
              width={36}
              height={27}
              className="h-7 w-auto mx-auto object-contain"
              priority
            />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={stripAdmin(item.href)}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200 group relative
                  ${
                    active
                      ? "nav-active bg-brand-subtle text-white font-medium"
                      : "text-text-gray hover:text-white hover:bg-surface-3"
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors duration-200 ${
                    active ? "text-(--color-brand)" : "text-text-gray group-hover:text-white"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}

                {/* Collapsed tooltip */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-surface-3 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 border border-glass-border">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle + Sign out */}
        <div className="border-t border-glass-border p-3 space-y-1">
          <button
            onClick={onToggle}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : (
              <>
                <PanelLeftClose size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
          <SignOutButton redirectUrl="/">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-gray hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut size={18} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
