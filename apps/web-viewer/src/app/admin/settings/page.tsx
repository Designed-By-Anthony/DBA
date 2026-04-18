"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getTenantSettings, updateTenantSettings, ensureTenantExists } from "./actions";
import { useOrganization } from "@clerk/nextjs";
import type { TenantRow } from "@dba/database";

export default function SettingsPage() {
  const { organization } = useOrganization();
  const [, setTenant] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [replyFromEmail, setReplyFromEmail] = useState("");
  const [replyFromName, setReplyFromName] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");

  useEffect(() => {
    async function load() {
      try {
        let t = await getTenantSettings();
        if (!t && organization?.name) {
          t = await ensureTenantExists(organization.name);
        }
        if (t) {
          setTenant(t);
          setName(t.name || "");
          setSupportEmail(t.supportEmail || "");
          setReplyFromEmail(t.replyFromEmail || "");
          setReplyFromName(t.replyFromName || "");
          setPhysicalAddress(t.physicalAddress || "");
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
      setLoading(false);
    }
    load();
  }, [organization?.name]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateTenantSettings({
        name,
        supportEmail,
        replyFromEmail,
        replyFromName,
        physicalAddress,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 bg-surface-2 rounded w-48" />
        <div className="h-4 bg-surface-2 rounded w-72" />
        <div className="grid gap-4 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface-2 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">General Settings</h1>
        <p className="text-xs text-text-muted mt-1">
          Business profile and contact information
        </p>
      </div>

      <div className="space-y-5">
        {/* Business Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-gray">Business Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            placeholder="Acme Services"
          />
        </div>

        {/* Support Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-gray">Support Email</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            placeholder="support@yourbusiness.com"
          />
          <p className="text-[11px] text-text-muted">
            Where customers will reply to automated emails
          </p>
        </div>

        {/* Reply-From Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-gray">Reply-From Email</label>
          <input
            type="email"
            value={replyFromEmail}
            onChange={(e) => setReplyFromEmail(e.target.value)}
            className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            placeholder="you@yourbusiness.com"
          />
        </div>

        {/* Reply-From Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-gray">Reply-From Name</label>
          <input
            type="text"
            value={replyFromName}
            onChange={(e) => setReplyFromName(e.target.value)}
            className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            placeholder="John at Acme"
          />
        </div>

        {/* Physical Address (CAN-SPAM) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-gray">Physical Address</label>
          <textarea
            value={physicalAddress}
            onChange={(e) => setPhysicalAddress(e.target.value)}
            rows={2}
            className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
            placeholder="123 Main St, City, ST 12345"
          />
          <p className="text-[11px] text-text-muted">
            Required by CAN-SPAM — appears in email footers
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-400 animate-fade-in">
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}
