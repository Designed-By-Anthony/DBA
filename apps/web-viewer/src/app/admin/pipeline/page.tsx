"use client";

import { useState, useEffect, useCallback } from "react";
import { getProspects, updateProspect, deleteProspect } from "../actions";
import type { Prospect, ProspectStatus } from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { useRouter } from "next/navigation";

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProspects = useCallback(async () => {
    try {
      const data = await getProspects();
      setProspects(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadProspects());
  }, [loadProspects]);

  const handleStatusChange = async (id: string, newStatus: ProspectStatus) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    await updateProspect(id, { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prospect?")) return;
    await deleteProspect(id);
    await loadProspects();
  };

  // Calculate days since creation or last activity
  const daysSince = useCallback((dateStr: string | null): number => {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="min-w-[280px] h-96 rounded-xl border border-glass-border animate-pulse"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline</h1>
          <p className="text-xs text-text-muted">
            {prospects.length} prospects · ${prospects.reduce((a, p) => a + (p.dealValue || 0), 0).toLocaleString()} total value
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/prospects")}
          className="px-4 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors shadow-(--color-brand-glow)"
        >
          + Add Prospect
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {pipelineStages.map((stage) => {
          const items = prospects.filter((p) => p.status === stage.id);
          const stageValue = items.reduce((a, p) => a + (p.dealValue || 0), 0);

          return (
            <div
              key={stage.id}
              className="min-w-[300px] max-w-[340px] flex-1 snap-start flex flex-col rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm overflow-hidden"
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-sm font-semibold text-white">{stage.label}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-text-muted">
                    {items.length}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">
                  ${stageValue.toLocaleString()}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                {items.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-6">No prospects</p>
                )}
                {items.map((prospect) => {
                  const days = daysSince(prospect.createdAt);
                  const isRotting = days > 7;
                  const isWarning = days > 3 && days <= 7;

                  return (
                    <div
                      key={prospect.id}
                      onClick={() => router.push(`/admin/prospects/${prospect.id}`)}
                      className={`
                        p-4 rounded-lg border transition-all cursor-pointer group
                        ${
                          isRotting
                            ? "border-red-500/30 bg-red-500/5 group-hover:bg-red-500/10"
                            : isWarning
                            ? "border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10"
                            : "border-glass-border bg-surface-2 group-hover:bg-surface-3"
                        }
                        hover:border-glass-border-hover
                      `}
                      style={isRotting ? { animation: "pulse-glow 3s infinite" } : undefined}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-white truncate">{prospect.name}</h4>
                          {prospect.company && (
                            <p className="text-xs text-text-muted truncate">{prospect.company}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(prospect.id);
                          }}
                          className="text-red-400/40 hover:text-red-400 text-xs transition-colors ml-2 p-1"
                        >
                          ×
                        </button>
                      </div>

                      {prospect.dealValue > 0 && (
                        <p className="text-sm font-bold text-emerald-400 mb-2">
                          ${prospect.dealValue.toLocaleString()}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                        {prospect.email && <span className="truncate max-w-[160px]">{prospect.email}</span>}
                      </div>

                      {/* Tags */}
                      {prospect.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-3">
                          {prospect.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Days + Stage Selector */}
                      <div className="flex items-center justify-between border-t border-glass-border pt-2 mt-2">
                        <span className={`text-[10px] ${isRotting ? "text-red-400" : isWarning ? "text-amber-400" : "text-text-muted"}`}>
                          {days}d in pipeline
                        </span>
                        <select
                          value={prospect.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(prospect.id, e.target.value as ProspectStatus)}
                          className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer hover:text-white"
                        >
                          {pipelineStages.map((s) => (
                            <option key={s.id} value={s.id} className="bg-surface-1">{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
