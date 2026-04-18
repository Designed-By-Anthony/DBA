"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getTenantSettings, updateTenantSettings } from "../actions";

export default function BrandingPage() {
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await getTenantSettings();
        if (t) {
          setBrandColor(t.brandColor || "#2563eb");
          setBrandLogoUrl(t.brandLogoUrl || "");
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
      await updateTenantSettings({ brandColor, brandLogoUrl });
      // Inject CSS variable live
      document.documentElement.style.setProperty("--color-brand", brandColor);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  // Preview color swatch
  const previewColors = [
    "#2563eb", "#7c3aed", "#0ea5e9", "#059669", "#ea580c",
    "#dc2626", "#d946ef", "#f59e0b", "#14b8a6", "#6366f1",
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 bg-surface-2 rounded w-40" />
        <div className="h-40 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Branding</h1>
        <p className="text-xs text-text-muted mt-1">
          Customize your CRM&apos;s look and feel
        </p>
      </div>

      {/* Brand Color */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-text-gray">Brand Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-12 h-12 rounded-lg border border-glass-border cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-28 bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-(--color-brand)"
          />
        </div>

        {/* Quick-pick presets */}
        <div className="flex gap-2 flex-wrap">
          {previewColors.map((c) => (
            <button
              key={c}
              onClick={() => setBrandColor(c)}
              className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                brandColor === c ? "border-white scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Live preview */}
        <div className="p-4 rounded-xl border border-glass-border bg-surface-1 space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider">Preview</p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: brandColor }}
            >
              OS
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your Agency</p>
              <p className="text-[11px]" style={{ color: brandColor }}>
                Agency OS • Powered by your brand
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            Sample Button
          </button>
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-gray">Logo URL</label>
        <input
          type="url"
          value={brandLogoUrl}
          onChange={(e) => setBrandLogoUrl(e.target.value)}
          className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
          placeholder="https://example.com/logo.png"
        />
        <p className="text-[11px] text-text-muted">
          Used in emails, portal, and client-facing reports
        </p>
        {brandLogoUrl && (
          <div className="mt-3 p-3 bg-surface-2 rounded-lg inline-block relative h-10 w-40">
            <Image
              src={brandLogoUrl}
              alt="Logo preview"
              fill
              className="object-contain object-left"
              unoptimized
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Branding"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-400 animate-fade-in">
            ✓ Saved &amp; applied
          </span>
        )}
      </div>
    </div>
  );
}
