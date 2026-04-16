"use client";

import { Bell, CheckCircle, AlertTriangle, Mail, UserPlus, ArrowRight } from "lucide-react";
import { UserButton, useUser, useOrganization } from "@clerk/nextjs";
import Omnisearch from "@/components/portal/Omnisearch";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminPrefix } from "@/lib/useAdminPrefix";
import { getRecentActivities } from "@/app/admin/actions";

type Notification = {
  id: string;
  type: "alert" | "success" | "info" | "email";
  title: string;
  body: string;
  href?: string;
  time: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityIcon(type: string) {
  switch (type) {
    case "alert": return <AlertTriangle size={12} className="text-red-400" />;
    case "success": return <CheckCircle size={12} className="text-emerald-400" />;
    case "email": return <Mail size={12} className="text-blue-400" />;
    default: return <UserPlus size={12} className="text-(--color-brand)" />;
  }
}

export default function TopBar({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void;
  title?: string;
}) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { user } = useUser();
  const { organization } = useOrganization();
  const firstName = user?.firstName || "there";
  const orgName = organization?.name;
  const router = useRouter();
  const stripAdmin = useAdminPrefix();

  // Load real activity data for notifications
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const activities = await getRecentActivities(10);
        if (cancelled) return;
        const mapped: Notification[] = activities.map((a: { id: string; type: string; description: string; prospectId?: string; createdAt: string }) => ({
          id: a.id,
          type: a.type === "status_change" ? "info" as const :
                a.type === "email_sent" || a.type === "email_opened" ? "email" as const :
                a.type === "churn_risk" ? "alert" as const : "success" as const,
          title: a.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          body: a.description,
          href: a.prospectId ? `/admin/prospects/${a.prospectId}` : undefined,
          time: a.createdAt,
        }));
        setNotifications(mapped);
        setHasUnread(mapped.length > 0);
      } catch {
        // Notifications are non-critical
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleNotifClick = (notif: Notification) => {
    if (notif.href) {
      setShowNotifs(false);
      router.push(stripAdmin(notif.href));
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6 border-b border-glass-border bg-(--color-surface-0)/80 backdrop-blur-xl">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-lg text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Title / Greeting */}
      <div className="flex flex-col min-w-0">
        <h2 className="text-sm font-semibold text-white leading-tight">
          {title || "Dashboard"}
        </h2>
        <p className="text-[11px] text-text-muted leading-tight hidden sm:block">
          {getGreeting()}, {firstName}{orgName ? ` · ${orgName}` : ""}
        </p>
      </div>

      {/* Spacer & Omnisearch Center Console */}
      <div className="flex-1 flex justify-center px-4">
        <Omnisearch />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 relative">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) setHasUnread(false); }}
          className={`relative p-2 rounded-lg transition-colors ${showNotifs ? 'bg-surface-3 text-white' : 'text-text-gray hover:text-white hover:bg-surface-3'}`}
        >
          <Bell size={18} />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-(--color-surface-0)" />
          )}
        </button>

        {showNotifs && (
          <div className="absolute top-12 right-12 w-80 bg-[#090A0F] border border-glass-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in z-50">
            <div className="p-3 border-b flex items-center justify-between border-glass-border bg-surface-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              <button onClick={() => setShowNotifs(false)} className="text-[10px] text-(--color-brand) hover:underline uppercase tracking-wide">Mark all read</button>
            </div>
            <div className="max-h-64 overflow-y-auto w-full">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={24} className="mx-auto mb-2 text-text-gray opacity-40" />
                  <p className="text-xs text-text-muted">No recent activity</p>
                  <p className="text-[10px] text-text-gray mt-1">Actions and updates will appear here</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left p-3 border-b border-glass-border hover:bg-surface-2 transition-colors relative overflow-hidden group ${notif.href ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {notif.type === "alert" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                    {notif.type === "success" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                    {notif.type === "email" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <p className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                      {activityIcon(notif.type)}
                      {notif.title}
                      {notif.href && <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-(--color-brand)" />}
                    </p>
                    <p className="text-[11px] text-text-muted line-clamp-2">{notif.body}</p>
                    <p className="text-[9px] text-text-gray mt-1.5 uppercase">{timeAgo(notif.time)}</p>
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t border-glass-border text-center">
              <button 
                onClick={() => { setShowNotifs(false); router.push(stripAdmin("/admin/inbox")); }}
                className="text-[11px] text-(--color-brand) hover:text-white transition-colors flex items-center gap-1 mx-auto"
              >
                View All Activity <ArrowRight size={10} />
              </button>
            </div>
          </div>
        )}

        <span className="text-xs text-text-muted hidden sm:block">
          Agency OS
        </span>

        {/* Clerk User Button — handles profile, org switching, sign out */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 ring-2 ring-[rgb(59_130_246/0.35)] ring-offset-2 ring-offset-[var(--color-surface-0)]",
            },
          }}
        />
      </div>
    </header>
  );
}
