"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Shield, Lock, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type EventConfig = {
  eventType: string;
  label: string;
  description: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  mandatory: boolean;
};

const EVENT_TYPES: Array<{ type: string; label: string; description: string }> = [
  { type: "new_lead", label: "New lead created", description: "When a new prospect enters the pipeline" },
  { type: "ticket_created", label: "Support ticket opened", description: "When a client creates a new ticket" },
  { type: "ticket_reply", label: "Ticket reply", description: "When a client replies to a ticket" },
  { type: "payment_received", label: "Payment received", description: "When a payment is processed" },
  { type: "stage_change", label: "Pipeline stage change", description: "When a deal moves stages" },
  { type: "daily_digest", label: "Daily digest", description: "Morning summary of pipeline activity" },
];

export default function NotificationsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("default");

  const loadPreferences = async () => {
    try {
      const defaults = EVENT_TYPES.map((e) => ({
        eventType: e.type,
        label: e.label,
        description: e.description,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        mandatory: false,
      }));
      setEvents(defaults);
    } catch {
      // non-critical
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
    loadPreferences();
  }, []);

  const handleToggle = (eventType: string, channel: "emailEnabled" | "pushEnabled" | "inAppEnabled") => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.eventType !== eventType) return e;
        // Can't toggle mandatory events
        if (e.mandatory) return e;
        return { ...e, [channel]: !e[channel] };
      }),
    );
  };

  const handleMandatoryToggle = (eventType: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.eventType !== eventType) return e;
        const newMandatory = !e.mandatory;
        return {
          ...e,
          mandatory: newMandatory,
          // If setting mandatory, force all channels on
          ...(newMandatory ? { emailEnabled: true, pushEnabled: true, inAppEnabled: true } : {}),
        };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Save preferences — placeholder for API integration
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error
    }
    setSaving(false);
  };

  const handleEnablePush = async () => {
    if (!pushSupported) return;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisuallyPrompts: true,
          applicationServerKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        } as PushSubscriptionOptionsInit);
        const subJson = sub.toJSON();
        await fetch("/api/admin/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
          }),
        });
      }
    } catch {
      // Push setup failed — non-critical
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="h-8 bg-surface-2 rounded w-40" />
        <div className="h-60 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Notification Preferences</h1>
        <p className="text-xs text-text-muted mt-1">
          Control how your team gets notified about CRM events.
          {user?.organizationMemberships?.[0]?.role === "org:admin" && (
            <span className="text-(--color-brand)"> As admin, you can enforce mandatory notifications.</span>
          )}
        </p>
      </div>

      {/* Push Notification Opt-in */}
      <div className="rounded-xl border border-glass-border bg-surface-1 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center text-(--color-brand)">
            <Smartphone size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Browser Push Notifications</h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Receive real-time notifications even when Agency OS isn&apos;t open
            </p>
          </div>
          {pushSupported && pushPermission === "granted" ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
              Enabled
            </span>
          ) : pushSupported && pushPermission === "denied" ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400">
              Blocked
            </span>
          ) : pushSupported ? (
            <button
              onClick={handleEnablePush}
              className="px-4 py-1.5 rounded-lg bg-(--color-brand) text-white text-[11px] font-semibold hover:bg-brand-hover transition-all"
            >
              Enable Push
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-3 text-text-gray">
              Not Supported
            </span>
          )}
        </div>
      </div>

      {/* Event Notifications Table */}
      <div className="rounded-xl border border-glass-border bg-surface-1 overflow-hidden">
        <div className="p-4 border-b border-glass-border bg-surface-2">
          <h2 className="text-sm font-semibold text-white">Event Notifications</h2>
          <p className="text-[10px] text-text-muted mt-0.5">
            Configure delivery channels for each event type
          </p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-2.5 border-b border-glass-border bg-surface-0/50 text-[10px] uppercase tracking-wider text-text-gray font-semibold">
          <span>Event</span>
          <span className="text-center flex items-center justify-center gap-1"><Mail size={10} /> Email</span>
          <span className="text-center flex items-center justify-center gap-1"><Bell size={10} /> Push</span>
          <span className="text-center flex items-center justify-center gap-1"><Smartphone size={10} /> In-App</span>
          <span className="text-center flex items-center justify-center gap-1"><Lock size={10} /> Required</span>
        </div>

        {/* Rows */}
        {events.map((event) => (
          <div
            key={event.eventType}
            className={`grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-3 border-b border-glass-border last:border-0 items-center transition-colors ${event.mandatory ? 'bg-surface-2/30' : 'hover:bg-surface-1/80'}`}
          >
            <div>
              <p className="text-xs font-medium text-white flex items-center gap-1.5">
                {event.label}
                {event.mandatory && <Shield size={10} className="text-amber-400" />}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{event.description}</p>
            </div>

            <div className="flex justify-center">
              <ChannelToggle
                enabled={event.emailEnabled}
                locked={event.mandatory}
                onChange={() => handleToggle(event.eventType, "emailEnabled")}
              />
            </div>
            <div className="flex justify-center">
              <ChannelToggle
                enabled={event.pushEnabled}
                locked={event.mandatory}
                onChange={() => handleToggle(event.eventType, "pushEnabled")}
              />
            </div>
            <div className="flex justify-center">
              <ChannelToggle
                enabled={event.inAppEnabled}
                locked={event.mandatory}
                onChange={() => handleToggle(event.eventType, "inAppEnabled")}
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleMandatoryToggle(event.eventType)}
                className={`w-8 h-5 rounded-full transition-all relative ${event.mandatory ? 'bg-amber-500' : 'bg-surface-3'}`}
                title={event.mandatory ? "Members cannot disable this event" : "Click to enforce for all members"}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${event.mandatory ? 'left-3.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Preferences"}
        </button>
        {saved && <span className="text-xs text-emerald-400 animate-fade-in">✓ Saved</span>}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-surface-1 border border-glass-border">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-white">Admin-Enforced Notifications</p>
            <p className="text-[10px] text-text-muted mt-1">
              Events marked as &ldquo;Required&rdquo; cannot be disabled by team members.
              Use this to ensure critical events like new leads and payments always
              reach your team through all channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelToggle({
  enabled,
  locked,
  onChange,
}: {
  enabled: boolean;
  locked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={locked ? undefined : onChange}
      disabled={locked}
      className={`w-8 h-5 rounded-full transition-all relative ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${enabled ? 'bg-(--color-brand)' : 'bg-surface-3'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-3.5' : 'left-0.5'}`} />
    </button>
  );
}
