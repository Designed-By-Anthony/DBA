"use client";

import { useState, useEffect } from "react";
import { getTenantSettings, updateTenantSettings } from "../actions";

type NotifPrefs = {
  emailOnNewLead: boolean;
  emailOnStageChange: boolean;
  emailOnTicket: boolean;
  emailDailyDigest: boolean;
  pushEnabled: boolean;
  pushOnNewLead: boolean;
  pushOnStageChange: boolean;
};

const defaultPrefs: NotifPrefs = {
  emailOnNewLead: true,
  emailOnStageChange: true,
  emailOnTicket: true,
  emailDailyDigest: false,
  pushEnabled: false,
  pushOnNewLead: true,
  pushOnStageChange: false,
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await getTenantSettings();
        if (t?.notificationPrefs && typeof t.notificationPrefs === "object") {
          setPrefs({ ...defaultPrefs, ...(t.notificationPrefs as Partial<NotifPrefs>) });
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateTenantSettings({ notificationPrefs: prefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 bg-surface-2 rounded w-40" />
        <div className="h-60 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="text-xs text-text-muted mt-1">
          Configure how and when you get notified about CRM events
        </p>
      </div>

      {/* Email Notifications */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          📧 Email Notifications
        </h2>
        <div className="space-y-2">
          {([
            ["emailOnNewLead", "New lead created", "Get an email when a new lead enters the pipeline"],
            ["emailOnStageChange", "Pipeline stage change", "Get notified when a deal moves stages"],
            ["emailOnTicket", "New support ticket", "Get notified when a client opens a ticket"],
            ["emailDailyDigest", "Daily digest", "Receive a morning summary of pipeline activity"],
          ] as const).map(([key, label, desc]) => (
            <label
              key={key}
              className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-surface-1 cursor-pointer hover:border-(--color-brand)/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => toggle(key)}
                className="mt-0.5 w-4 h-4 rounded text-(--color-brand) focus:ring-(--color-brand) bg-surface-2 border-glass-border"
              />
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          🔔 Push Notifications
        </h2>
        <div className="space-y-2">
          <label className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-surface-1 cursor-pointer hover:border-(--color-brand)/30 transition-colors">
            <input
              type="checkbox"
              checked={prefs.pushEnabled}
              onChange={() => toggle("pushEnabled")}
              className="mt-0.5 w-4 h-4 rounded text-(--color-brand) focus:ring-(--color-brand) bg-surface-2 border-glass-border"
            />
            <div>
              <p className="text-sm font-medium text-white">Enable browser push</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Receive real-time browser notifications (requires permission)
              </p>
            </div>
          </label>

          {prefs.pushEnabled && (
            <>
              {([
                ["pushOnNewLead", "Push on new lead", "Instant notification when a lead comes in"],
                ["pushOnStageChange", "Push on stage change", "Notification when a deal stage changes"],
              ] as const).map(([key, label, desc]) => (
                <label
                  key={key}
                  className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-surface-1 cursor-pointer hover:border-(--color-brand)/30 transition-colors ml-4"
                >
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={() => toggle(key)}
                    className="mt-0.5 w-4 h-4 rounded text-(--color-brand) focus:ring-(--color-brand) bg-surface-2 border-glass-border"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {saved && <span className="text-xs text-emerald-400 animate-fade-in">✓ Saved</span>}
      </div>
    </div>
  );
}
