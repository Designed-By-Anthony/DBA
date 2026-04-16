"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import QuickAddLead from "@/components/ui/QuickAddLead";
import { VerticalProvider } from "@/lib/VerticalContext";

export default function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  // Keep the initial SSR/first-client render stable; load localStorage after mount.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
      } catch {
        // ignore (storage disabled)
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
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
          <TopBar
            onMenuClick={() => setMobileOpen(true)}
            title={title}
          />

          <main className="p-6 page-enter">
            {children}
          </main>

          <QuickAddLead />
        </div>
      </div>
    </VerticalProvider>
  );
}

