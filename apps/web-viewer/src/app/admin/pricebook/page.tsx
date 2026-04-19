"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStripeProducts,
  createStripeProductAction,
  setStripeProductActiveAction,
  StripeProductDetail,
} from "../actions/stripe";
import { formatCents, dollarsToCents } from "@/lib/currency";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function PriceBookPage() {
  const [products, setProducts] = useState<StripeProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** When true, fetch active + archived; when false, active catalog only. */
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceDollars: "",
    interval: "month" as "month" | "year" | "one_time"
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStripeProducts({ includeArchived: showArchived });
      if (res.error) {
        setError(res.error);
        setProducts([]);
      } else {
        setProducts(res.products);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load Stripe catalog";
      setError(msg);
      setProducts([]);
    }
    setLoading(false);
  }, [showArchived]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  const handleArchiveToggle = async (productId: string, nextActive: boolean) => {
    setBusyId(productId);
    const res = await setStripeProductActiveAction({ productId, active: nextActive });
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(
        nextActive
          ? "Product restored — it will appear in quotes and new checkouts again."
          : "Product archived — hidden from new quotes and checkouts (existing subscriptions unchanged).",
      );
      await loadData();
    }
    setBusyId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.priceDollars) return alert("Name and price required");

    setSubmitting(true);
    const res = await createStripeProductAction({
      name: form.name,
      description: form.description,
      priceAmountCents: dollarsToCents(form.priceDollars),
      interval: form.interval,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product published to Stripe — available for quotes & payment links.");
      setShowModal(false);
      setForm({ name: "", description: "", priceDollars: "", interval: "month" });
      await loadData();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Stripe Price Book</h1>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Source of truth for services and retainers in Stripe. Products here power proposals, checkout, and payment links from prospect records — keep names and prices aligned with what clients see.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-glass-border bg-surface-2 text-text-muted text-sm cursor-pointer select-none hover:bg-surface-3 transition-colors">
            <input
              type="checkbox"
              className="rounded border-glass-border"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-glass-border bg-surface-2 text-white text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-(--color-brand) text-white text-sm font-medium hover:bg-brand-hover transition-colors shadow-(--color-brand-glow)"
          >
            + Create Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted animate-pulse">
          Syncing from Stripe...
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 px-4 rounded-xl border border-glass-border bg-glass-bg">
              <p className="text-2xl mb-2">💸</p>
              <p className="text-text-muted font-medium">Your price book is completely empty</p>
              <button 
                onClick={() => setShowModal(true)}
                className="mt-4 text-(--color-brand) hover:underline text-sm"
              >
                Create your first Stripe Product
              </button>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.active ? 'Active' : 'Archived'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white pr-16">{p.name}</h3>
                <p className="text-sm text-text-muted line-clamp-2 mt-1 h-10">
                  {p.description || 'No description provided.'}
                </p>
                <div className="mt-4 pt-4 border-t border-glass-border flex flex-wrap justify-between items-end gap-3">
                  <div>
                    <span className="text-2xl font-black text-white">
                      {p.default_price ? formatCents(p.default_price.unit_amount) : 'N/A'}
                    </span>
                    <span className="text-xs text-text-muted ml-1">
                      {p.default_price?.type === 'recurring' 
                        ? `/${p.default_price.recurring?.interval}` 
                        : ' One-Time'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {p.active ? (
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void handleArchiveToggle(p.id, false)}
                        className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                      >
                        {busyId === p.id ? "…" : "Archive"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void handleArchiveToggle(p.id, true)}
                        className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                      >
                        {busyId === p.id ? "…" : "Restore"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-glass-border bg-[#0d0e14]/95 backdrop-blur-xl shadow-[0_0_80px_rgba(37,99,235,0.08),0_24px_48px_rgba(0,0,0,0.6)] animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border bg-gradient-to-r from-surface-2/80 to-transparent rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-white">New Stripe Product</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Publish a product to your Stripe catalog</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Product Name</label>
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Local SEO Expansion"
                  className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Appears on invoice..."
                  className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-text-muted">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.priceDollars}
                      onChange={(e) => setForm({...form, priceDollars: e.target.value})}
                      placeholder="199.00"
                      className="w-full bg-surface-0/60 border border-glass-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Billing Interval</label>
                  <select
                    value={form.interval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        interval: e.target.value as "month" | "year" | "one_time",
                      })
                    }
                    className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                  >
                    <option value="one_time">One-Time Fee</option>
                    <option value="month">Monthly Retainer</option>
                    <option value="year">Annual Retainer</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-text-muted hover:text-white hover:bg-surface-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white font-semibold text-sm transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                >
                  {submitting ? 'Pushing to Stripe...' : 'Publish to Stripe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
