"use client";

import { useState } from "react";

export default function NotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission;
  });
  const [subscribed, setSubscribed] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "granted";
  });
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("push-opt-in-dismissed");
  });

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Register the service worker and get the push subscription
        const registration = await navigator.serviceWorker.ready;

        // For now, use the PushManager subscription token
        // (Full FCM VAPID key integration in next session)
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY ?? undefined,
        }).catch(() => null);

        if (sub) {
          // Send token to our API
          await fetch("/api/portal/push-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: JSON.stringify(sub) }),
          });
          setSubscribed(true);
        }
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push-opt-in-dismissed", "1");
  };

  const handleDisable = async () => {
    setLoading(true);
    await fetch("/api/portal/push-token", { method: "DELETE" });
    setSubscribed(false);
    setPermission("default");
    localStorage.removeItem("push-opt-in-dismissed");
    setLoading(false);
  };

  // Don't show if not supported, already dismissed, or already blocked
  if (dismissed || permission === "denied" || typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  // Already subscribed — show a small indicator with disable option
  if (subscribed) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
        <div className="flex items-center gap-2">
          <span>🔔</span>
          <span className="text-emerald-400 text-xs">Push notifications enabled</span>
        </div>
        <button
          onClick={handleDisable}
          disabled={loading}
          className="text-[10px] text-[var(--color-text-muted)] hover:text-white transition-colors"
        >
          Disable
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Get notified instantly</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Receive push notifications when we update your project or reply to a ticket — no email needed.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Enable Notifications"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-white text-xs transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
