"use client";

import { useState } from "react";
import type { BusinessSettings } from "@/lib/types";

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({
    depositPolicy: 'percentage',
    depositAmount: 25, // 25%
    cancellationWindowHours: 24,
    requireDigitalWaiver: false,
    enableOnlineOrdering: false,
    inventoryMode: 'standard',
  });

  const handleSave = async () => {
    setLoading(true);
    // In a real app we'd trigger an action to persist this to Postgres (org_settings).
    // e.g. await saveBusinessSettings(settings);
    setTimeout(() => {
      alert("Business Settings successfully saved!");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Business Settings</h1>
        <p className="text-text-muted mt-2">Configure platform-wide rules, billing policies, and regulatory compliance requirements.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reservation & Booking Rules */}
        <div className="bg-surface-1 border border-glass-border rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-glass-border pb-3">Booking Rules & Revenue Protection</h2>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-gray">Upfront Deposit Policy</label>
            <select
              value={settings.depositPolicy}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  depositPolicy: e.target.value as BusinessSettings["depositPolicy"],
                })
              }
              className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand)"
            >
              <option value="percentage">Percentage Based (%)</option>
              <option value="flat">Flat Fee ($)</option>
              <option value="full">100% Full Prepayment</option>
            </select>
          </div>

          {settings.depositPolicy !== 'full' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-gray">
                {settings.depositPolicy === 'percentage' ? 'Deposit Percentage (%)' : 'Flat Deposit Amount ($)'}
              </label>
              <input
                type="number"
                value={settings.depositPolicy === 'percentage' ? settings.depositAmount : settings.depositAmount / 100}
                onChange={(e) => {
                  let val = parseFloat(e.target.value) || 0;
                  if (settings.depositPolicy === 'flat') val = Math.round(val * 100);
                  setSettings({ ...settings, depositAmount: val });
                }}
                className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand)"
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-gray">Cancellation Window (Hours)</label>
            <p className="text-xs text-text-muted mb-2">Deposits are forfeit if cancelled within this window.</p>
            <input
              type="number"
              value={settings.cancellationWindowHours}
              onChange={(e) => setSettings({ ...settings, cancellationWindowHours: parseInt(e.target.value) || 24 })}
              className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand)"
            />
          </div>
        </div>

        {/* Feature Toggles & Compliance */}
        <div className="bg-surface-1 border border-glass-border rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-glass-border pb-3">Feature Toggles & Compliance</h2>

          <label className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-surface-2 cursor-pointer hover:border-(--color-brand) transition-colors">
            <input 
              type="checkbox" 
              checked={settings.requireDigitalWaiver}
              onChange={e => setSettings({...settings, requireDigitalWaiver: e.target.checked})}
              className="mt-1 w-5 h-5 rounded text-(--color-brand) focus:ring-(--color-brand) bg-surface-1 border-glass-border"
            />
            <div>
              <p className="text-sm font-medium text-white">Require Digital Waivers</p>
              <p className="text-xs text-text-muted mt-1">Block fitness/studio check-ins if no HTML signature is on file.</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-surface-2 cursor-pointer hover:border-(--color-brand) transition-colors">
            <input 
              type="checkbox" 
              checked={settings.enableOnlineOrdering}
              onChange={e => setSettings({...settings, enableOnlineOrdering: e.target.checked})}
              className="mt-1 w-5 h-5 rounded text-(--color-brand) focus:ring-(--color-brand) bg-surface-1 border-glass-border"
            />
            <div>
              <p className="text-sm font-medium text-white">Online Ordering Portals</p>
              <p className="text-xs text-text-muted mt-1">Enable digital ordering menus linked directly to KDS systems.</p>
            </div>
          </label>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-text-gray">Inventory Depletion Mode</label>
            <select
              value={settings.inventoryMode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  inventoryMode: e.target.value as BusinessSettings["inventoryMode"],
                })
              }
              className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand)"
            >
              <option value="standard">Standard (Manual Alerts)</option>
              <option value="strict">Strict (Auto &quot;86&quot; on Empty)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-(--color-brand) text-white font-bold hover:bg-brand-hover transition-all disabled:opacity-50 shadow-(--color-brand-subtle)"
        >
          {loading ? 'Committing...' : 'Save Global Rules'}
        </button>
      </div>

    </div>
  );
}
