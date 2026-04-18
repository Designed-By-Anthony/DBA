"use client";

import { useState, useEffect } from "react";
import { getTenantSettings, updateTenantSettings } from "../actions";
import { Hammer, Building2 } from "lucide-react";

type VerticalOption = {
  id: "agency" | "service_pro";
  name: string;
  description: string;
  icon: typeof Building2;
  emoji: string;
};

const verticals: VerticalOption[] = [
  {
    id: "agency",
    name: "Agency / Creative",
    description: "Web design, marketing, consulting, photography. Pipeline: Lead → Contacted → Proposal → Development → Launched",
    icon: Building2,
    emoji: "🎯",
  },
  {
    id: "service_pro",
    name: "Service Professional",
    description: "HVAC, plumbing, electrical, landscaping, cleaning. Pipeline: Request → Estimate → Scheduled → In Progress → Completed",
    icon: Hammer,
    emoji: "🏗️",
  },
];

export default function VerticalPage() {
  const [selected, setSelected] = useState<"agency" | "service_pro">("agency");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await getTenantSettings();
        if (t?.verticalType === "service_pro") {
          setSelected("service_pro");
        } else {
          setSelected("agency");
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
      await updateTenantSettings({ verticalType: selected });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
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
        <h1 className="text-xl font-bold text-white">Industry Vertical</h1>
        <p className="text-xs text-text-muted mt-1">
          Choose your industry to customize terminology, pipeline stages, and sidebar navigation
        </p>
      </div>

      <div className="space-y-3">
        {verticals.map((v) => {
          const isSelected = selected === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-(--color-brand) bg-(--color-brand)/5"
                  : "border-glass-border bg-surface-1 hover:border-(--color-brand)/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    isSelected ? "bg-(--color-brand)/20" : "bg-surface-2"
                  }`}
                >
                  {v.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{v.name}</h3>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-(--color-brand)/20 text-(--color-brand) font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{v.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-xs text-amber-400">
          <strong>Note:</strong> Changing your vertical will update sidebar labels, pipeline stage names, and field terminology.
          Existing data is preserved — only the UI language changes.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Vertical"}
        </button>
        {saved && <span className="text-xs text-emerald-400 animate-fade-in">✓ Saved</span>}
      </div>
    </div>
  );
}
