"use client";

import { useState, useEffect } from "react";
import { getTenantSettings, updateTenantSettings } from "../actions";
import { Plus, Trash2 } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await getTenantSettings();
        if (t?.dealSources && Array.isArray(t.dealSources)) {
          setSources(t.dealSources as string[]);
        } else {
          setSources(["Lighthouse Audit", "Referral", "Cold Outbound", "Inbound", "Organic", "Social Media"]);
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
      await updateTenantSettings({ dealSources: sources });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const addSource = () => {
    const trimmed = newSource.trim();
    if (!trimmed || sources.includes(trimmed)) return;
    setSources([...sources, trimmed]);
    setNewSource("");
  };

  const removeSource = (idx: number) => {
    setSources(sources.filter((_, i) => i !== idx));
  };

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
        <h1 className="text-xl font-bold text-white">Deal Sources</h1>
        <p className="text-xs text-text-muted mt-1">
          Configure where your leads come from for tracking and attribution
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((source, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-4 py-2.5 bg-surface-1 border border-glass-border rounded-lg group"
          >
            <span className="text-sm text-white flex-1">{source}</span>
            <button
              onClick={() => removeSource(idx)}
              className="p-1 rounded text-text-gray hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSource()}
          className="flex-1 bg-surface-2 border border-glass-border rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-(--color-brand)"
          placeholder="New source name..."
        />
        <button
          onClick={addSource}
          className="px-4 py-2 rounded-lg border border-glass-border text-text-gray hover:text-white hover:border-(--color-brand) transition-colors text-sm flex items-center gap-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Sources"}
        </button>
        {saved && <span className="text-xs text-emerald-400 animate-fade-in">✓ Saved</span>}
      </div>
    </div>
  );
}
