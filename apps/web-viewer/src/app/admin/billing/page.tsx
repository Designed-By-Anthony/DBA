"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getInvoices } from "../actions";
import type { Invoice } from "@/lib/types";

const statusColors: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  overdue: "text-red-400 bg-red-500/10 border-red-500/20",
  draft: "text-[var(--color-text-muted)] bg-white/5 border-white/10",
  cancelled: "text-[var(--color-text-muted)] bg-white/5 border-white/10",
};

const typeLabels: Record<string, string> = {
  down_payment: "Down Payment",
  completion: "Completion",
  retainer: "Retainer",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadInvoices = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadInvoices());
  }, [loadInvoices]);

  const filtered =
    filter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === filter || inv.type === filter);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const mrr = invoices
    .filter((i) => i.type === "retainer" && i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Billing & Invoices</h1>
        <p className="text-xs text-text-muted">
          Payment tracking powered by Stripe
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-400">${totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Retainers</p>
          <p className="text-2xl font-bold text-(--color-brand)">${mrr.toLocaleString()}/mo</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All" },
          { id: "paid", label: "Paid" },
          { id: "pending", label: "Pending" },
          { id: "down_payment", label: "Down Payments" },
          { id: "completion", label: "Completions" },
          { id: "retainer", label: "Retainers" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === f.id
                ? "bg-(--color-brand) border-(--color-brand) text-white"
                : "bg-surface-2 border-glass-border text-text-muted hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg mb-2">💳</p>
            <p className="text-sm text-text-muted">
              {invoices.length === 0
                ? "No invoices yet — create one from a prospect's profile"
                : "No invoices match this filter"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="px-5 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">Client</th>
                <th className="px-5 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">Type</th>
                <th className="px-5 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">Amount</th>
                <th className="px-5 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">Status</th>
                <th className="px-5 py-3 text-xs text-text-muted uppercase tracking-wider font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-3 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/prospects/${inv.prospectId}`}
                      className="text-white hover:text-(--color-brand) transition-colors"
                    >
                      {inv.prospectName || "Unknown"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-gray">
                    {typeLabels[inv.type] || inv.type}
                  </td>
                  <td className="px-5 py-3 text-white font-medium">
                    ${inv.amount.toLocaleString()}
                    {inv.type === "retainer" && <span className="text-xs text-text-muted">/mo</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[inv.status] || ""}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-muted hidden md:table-cell">
                    {inv.paidAt
                      ? new Date(inv.paidAt).toLocaleDateString()
                      : inv.createdAt
                      ? new Date(inv.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
