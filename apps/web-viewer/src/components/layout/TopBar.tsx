"use client";

import { Bell, CheckCircle, AlertTriangle, Mail, UserPlus, ArrowRight } from "lucide-react";
import { UserButton, useUser, useOrganization } from "@clerk/nextjs";
import Omnisearch from "@/components/portal/Omnisearch";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAdminPrefix } from "@/lib/useAdminPrefix";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  isRead: boolean;
  createdAt: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function subscribeClientReady() {
  return () => undefined;
}

function getClientReadySnapshot() {
  return true;
}

function getServerReadySnapshot() {
  return false;
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

function notifIcon(type: string) {
  switch (type) {
    case "payment_received": return <CheckCircle size={12} className="text-emerald-400" />;
    case "ticket_created":
    case "ticket_reply": return <AlertTriangle size={12} className="text-amber-400" />;
    case "email_sent":
    case "email_opened": return <Mail size={12} className="text-blue-400" />;
    case "new_lead": return <UserPlus size={12} className="text-(--color-brand)" />;
    default: return <Bell size={12} className="text-text-gray" />;
  }
}

function notifAccentColor(type: string): string {
  switch (type) {
    case "payment_received": return "bg-emerald-500";
    case "ticket_created":
    case "ticket_reply": return "bg-amber-500";
    case "new_lead": return "bg-blue-500";
    default: return "bg-text-gray";
  }
}

async function fetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    const res = await fetch("/api/admin/notifications?unread=false", { cache: "no-store" });
    if (!res.ok) return { notifications: [], unreadCount: 0 };
    return await res.json() as { notifications: Notification[]; unreadCount: number };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

async function markAllRead(): Promise<void> {
  try {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  } catch {
    // non-critical
  }
}

async function markRead(ids: string[]): Promise<void> {
  try {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  } catch {
    // non-critical
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const { organization } = useOrganization();
  const firstName = user?.firstName || "there";
  const orgName = organization?.name;
  const clientReady = useSyncExternalStore(
    subscribeClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );
  const greetingSubtitle = clientReady
    ? `${getGreeting()}, ${firstName}${orgName ? ` · ${orgName}` : ""}`
    : "";
  const router = useRouter();
  const stripAdmin = useAdminPrefix();

  // Load notifications from API + poll every 30s
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchNotifications();
      if (cancelled) return;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) {
      markRead([notif.id]);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
    }
    const href = notif.actionUrl || (notif.referenceId && notif.referenceType === "lead"
      ? `/admin/prospects/${notif.referenceId}`
      : null);
    if (href) {
      setShowNotifs(false);
      router.push(stripAdmin(href));
    }
  };

  const handleMarkAllRead = () => {
    markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
        <p className="text-[11px] text-text-muted leading-tight hidden sm:block min-h-[1.25rem]">
          {greetingSubtitle}
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
          onClick={() => setShowNotifs(!showNotifs)}
          className={`relative p-2 rounded-lg transition-colors ${showNotifs ? 'bg-surface-3 text-white' : 'text-text-gray hover:text-white hover:bg-surface-3'}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger rounded-full border-2 border-(--color-surface-0) text-[9px] font-bold text-white px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute top-12 right-12 w-80 bg-[#090A0F] border border-glass-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in z-50">
            <div className="p-3 border-b flex items-center justify-between border-glass-border bg-surface-2">
              <span className="text-sm font-semibold text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-[10px] font-normal text-text-muted">
                    {unreadCount} unread
                  </span>
                )}
              </span>
              <button onClick={handleMarkAllRead} className="text-[10px] text-(--color-brand) hover:underline uppercase tracking-wide">Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto w-full">
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
                    className={`w-full text-left p-3 border-b border-glass-border hover:bg-surface-2 transition-colors relative overflow-hidden group ${!notif.isRead ? 'bg-surface-1/50' : ''} ${notif.actionUrl || notif.referenceId ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${notifAccentColor(notif.type)}`} />
                    <p className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5 pl-2">
                      {notifIcon(notif.type)}
                      <span className={notif.isRead ? "opacity-70" : ""}>{notif.title}</span>
                      {!notif.isRead && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-(--color-brand) shrink-0" />}
                      {(notif.actionUrl || notif.referenceId) && <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-(--color-brand)" />}
                    </p>
                    <p className="text-[11px] text-text-muted line-clamp-2 pl-2">{notif.body}</p>
                    <p className="text-[9px] text-text-gray mt-1.5 uppercase pl-2">{timeAgo(notif.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t border-glass-border text-center">
              <button 
                onClick={() => { setShowNotifs(false); router.push(stripAdmin("/admin/settings/notifications")); }}
                className="text-[11px] text-(--color-brand) hover:text-white transition-colors flex items-center gap-1 mx-auto"
              >
                Notification Settings <ArrowRight size={10} />
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
