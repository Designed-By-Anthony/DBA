"use client";

import { useState, useEffect, useCallback } from "react";
import { getStripeProducts, createStripeProductAction, StripeProductDetail } from "../actions/stripe";
import { formatCents, dollarsToCents } from "@/lib/currency";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function PriceBookPage() {
  const [products, setProducts] = useState<StripeProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const res = await getStripeProducts();
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
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

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
                <div className="mt-4 pt-4 border-t border-glass-border flex justify-between items-end">
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
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-1 rounded-2xl border border-glass-border p-6 shadow-2xl relative animate-fade-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-text-gray hover:text-white transition-colors"
            >
              ╳
            </button>
            <h2 className="text-xl font-bold text-white mb-6">New Stripe Product</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-gray mb-1">Product Name</label>
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Local SEO Expansion"
                  className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-gray mb-1">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Appears on invoice..."
                  className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-gray mb-1">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-text-muted">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.priceDollars}
                      onChange={(e) => setForm({...form, priceDollars: e.target.value})}
                      placeholder="199.00"
                      className="w-full bg-surface-2 border border-glass-border rounded-lg pl-7 pr-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-gray mb-1">Billing Interval</label>
                  <select
                    value={form.interval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        interval: e.target.value as "month" | "year" | "one_time",
                      })
                    }
                    className="w-full bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
                  >
                    <option value="one_time">One-Time Fee</option>
                    <option value="month">Monthly Retainer</option>
                    <option value="year">Annual Retainer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-3 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white font-bold transition-all disabled:opacity-50"
              >
                {submitting ? 'Pushing to Stripe...' : 'Publish to Stripe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
