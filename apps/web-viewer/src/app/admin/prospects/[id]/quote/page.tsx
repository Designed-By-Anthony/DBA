"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProspectById } from "../../../actions";
import { getStripeProducts, type StripeProductDetail } from "@/app/admin/actions/stripe";
import type { Prospect, QuotePackage, QuoteTier } from "@/lib/types";
import { formatCents } from "@/lib/currency";

interface TierState {
  name: string;
  items: StripeProductDetail[];
}

function toQuoteInterval(interval: string | undefined): "month" | "year" | undefined {
  return interval === "month" || interval === "year" ? interval : undefined;
}

export default function QuoteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const prospectId = params.id as string;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [stripeProducts, setStripeProducts] = useState<StripeProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quote Data
  const [tiers, setTiers] = useState<Record<QuoteTier, TierState>>({
    standard: { name: "Standard Package", items: [] },
    good: { name: "Bronze Tier", items: [] },
    better: { name: "Silver Tier", items: [] },
    best: { name: "Gold Tier", items: [] },
  });
  
  const [activeTier, setActiveTier] = useState<QuoteTier>('standard');
  const [multiTier, setMultiTier] = useState(false); // If false, just 1 standard quote

  const loadData = useCallback(async () => {
    try {
      const [p, stripeRes] = await Promise.all([
        getProspectById(prospectId),
        getStripeProducts(),
      ]);
      setProspect(p);
      if (stripeRes.products) {
        setStripeProducts(stripeRes.products);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [prospectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItemToTier = (productId: string) => {
    const product = stripeProducts.find(p => p.id === productId);
    if (!product) return;

    setTiers(prev => {
      const tierItems = prev[activeTier].items;
      if (tierItems.find(i => i.id === productId)) return prev; // Already added
      return {
        ...prev,
        [activeTier]: {
          ...prev[activeTier],
          items: [...tierItems, product]
        }
      };
    });
  };

  const handleRemoveItemFromTier = (tierKey: QuoteTier, productId: string) => {
    setTiers(prev => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        items: prev[tierKey].items.filter(i => i.id !== productId)
      }
    }));
  };

  const calculateTotal = (tierItems: StripeProductDetail[]) => {
    const recurring = tierItems.filter(i => i.default_price?.type === 'recurring')
                               .reduce((sum, i) => sum + (i.default_price?.unit_amount || 0), 0);
    const once = tierItems.filter(i => i.default_price?.type !== 'recurring')
                          .reduce((sum, i) => sum + (i.default_price?.unit_amount || 0), 0);
    return { recurring, once };
  };

  const handleSaveQuote = async () => {
    setSaving(true);
    
    // Construct Quote Payload
    const packagesToSave: QuoteTier[] = multiTier ? ['good', 'better', 'best'] : ['standard'];
    const formattedPackages: QuotePackage[] = packagesToSave.map((tierKey) => {
      const tierData = tiers[tierKey];
      const items = tierData.items.map(p => ({
        stripeProductId: p.id,
        name: p.name,
        priceCents: p.default_price?.unit_amount || 0,
        type: p.default_price?.type || 'one_time',
        interval: toQuoteInterval(p.default_price?.recurring?.interval),
      }));
      const totals = calculateTotal(tierData.items);
      return {
        id: tierKey,
        tier: tierKey,
        title: tierData.name,
        items,
        totalOneTimeCents: totals.once,
        totalRecurringCents: totals.recurring
      };
    });

    try {
      const { saveQuoteAction } = await import("../../../actions");
      const res = await saveQuoteAction(prospectId, { packages: formattedPackages });
      if (res.quoteId) {
        router.push(`/portal/quote/${res.quoteId}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save quote.");
    }
    
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading framework...</div>;
  if (!prospect) return <div className="p-8 text-white">Prospect not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[var(--color-glass-border)] pb-6">
        <div className="w-12 h-12 bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-xl flex items-center justify-center text-white text-xl shadow-inner font-bold">
          {prospect.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{prospect.name}</h1>
            {prospect.company && (
              <span className="text-[var(--color-text-muted)] mt-1">• {prospect.company}</span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-gray)] border-l-2 border-[var(--color-brand)] pl-2 mt-1">
            Quote / Proposal Builder
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Menu / Price Book */}
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-xl p-5 h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-sm font-semibold text-white mb-4">Price Book Catalog</h2>
          <div className="space-y-2">
            {stripeProducts.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">No products in Stripe Pricebook.</p>
            )}
            {stripeProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleAddItemToTier(p.id)}
                className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-lg cursor-pointer hover:border-[var(--color-brand)] transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm text-white font-medium group-hover:text-[var(--color-brand)] transition-colors">{p.name}</p>
                  <p className="text-sm text-white">{formatCents(p.default_price?.unit_amount || 0)}</p>
                </div>
                {p.default_price?.type === 'recurring' && (
                  <p className="text-[10px] text-[var(--color-brand)] mt-1">/ {p.default_price.recurring?.interval}</p>
                )}
                <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">{p.description || "No description"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Quote Constructor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Quote Structure</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Toggle tiers to offer Good/Better/Best options</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-[var(--color-surface-2)] px-4 py-2 rounded-lg border border-[var(--color-glass-border)] hover:bg-[var(--color-surface-3)] transition-colors">
              <input 
                type="checkbox" 
                checked={multiTier} 
                onChange={(e) => {
                  setMultiTier(e.target.checked);
                  if (!e.target.checked) setActiveTier('standard');
                  else setActiveTier('good');
                }}
                className="w-4 h-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)] bg-[var(--color-surface-1)] border-[var(--color-glass-border)]"
              />
              <span className="text-sm text-white font-medium">Multi-Tier Pricing</span>
            </label>
          </div>

          {/* Builder Canvas */}
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-xl p-5">
            {multiTier ? (
              <div className="flex gap-2 mb-6 border-b border-[var(--color-glass-border)] pb-4">
                {(['good', 'better', 'best'] as QuoteTier[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTier(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTier === t 
                        ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand-subtle)]' 
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-gray)] hover:text-white border border-[var(--color-glass-border)]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)} Tier
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <span className="px-3 py-1 bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-md text-xs font-semibold text-[var(--color-text-gray)] uppercase tracking-wider">
                  Single Standard Quote
                </span>
              </div>
            )}

            <div className="min-h-[300px]">
              <h3 className="text-white font-medium mb-4 flex items-center justify-between">
                <span>{tiers[activeTier].name} Items</span>
                <span className="text-xs text-[var(--color-text-muted)] font-normal">Click items on the left to add</span>
              </h3>
              
              {tiers[activeTier].items.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-[var(--color-glass-border)] rounded-xl flex items-center justify-center text-[var(--color-text-muted)] text-sm bg-[var(--color-surface-2)]">
                  Canvas is empty. Select services from the Price Book.
                </div>
              ) : (
                <div className="space-y-3">
                  {tiers[activeTier].items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-white font-mono">{formatCents(item.default_price?.unit_amount || 0)}</p>
                          <p className="text-[10px] text-[var(--color-brand)]">{item.default_price?.type === 'recurring' ? 'Recurring' : 'One-Time'}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveItemFromTier(activeTier, item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Tier Subtotal */}
                  <div className="mt-6 border-t border-[var(--color-glass-border)] pt-4 flex justify-end gap-8">
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Due Today</p>
                      <p className="text-lg text-white font-mono font-bold">
                        {formatCents(calculateTotal(tiers[activeTier].items).once)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Recurring</p>
                      <p className="text-lg text-[var(--color-brand)] font-mono font-bold">
                        {formatCents(calculateTotal(tiers[activeTier].items).recurring)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-xl p-5">
             <Link href={`/admin/prospects/${prospectId}`} className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors">
               Cancel
             </Link>
             <button 
               onClick={handleSaveQuote}
               disabled={saving}
               className="px-6 py-2.5 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-lg shadow-[var(--color-brand-subtle)] disabled:opacity-50"
              >
               {saving ? 'Generating...' : 'Save & Preview Client Portal'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
