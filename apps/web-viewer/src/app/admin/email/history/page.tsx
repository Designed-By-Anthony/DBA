"use client";

import { useState, useEffect, useCallback } from "react";
import { getEmailHistory } from "../../actions";
import type { EmailRecord } from "@/lib/types";

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadEmails = useCallback(async () => {
    try {
      const data = await getEmailHistory();
      setEmails(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadEmails());
  }, [loadEmails]);

  const filtered = emails.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  const totalOpens = emails.reduce((acc, e) => acc + (e.opens || 0), 0);
  const totalClicks = emails.reduce((acc, e) => acc + (Array.isArray(e.clicks) ? e.clicks.length : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Email History</h1>
          <p className="text-xs text-text-muted">
            {emails.length} emails · {totalOpens} opens · {totalClicks} clicks
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "sent", "scheduled", "draft", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
              filter === f
                ? "bg-brand-subtle border-(--color-brand) text-white"
                : "bg-surface-2 border-glass-border text-text-gray hover:text-white"
            }`}
          >
            {f} {f !== "all" && `(${emails.filter((e) => e.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📬</span>
            </div>
            <p className="text-sm font-medium text-white mb-1">No emails sent yet</p>
            <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
              Once you send emails to your prospects, you&apos;ll see open rates, click tracking, and delivery status here.
            </p>
            <a href="/email" className="inline-flex items-center gap-2 text-xs text-(--color-brand) hover:underline">
              Compose your first email →
            </a>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {filtered.map((email) => (
              <div key={email.id}>
                <button
                  onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                  className="w-full text-left px-5 py-4 hover:bg-surface-3 transition-colors flex items-center gap-4"
                >
                  <span className="text-lg shrink-0">
                    {email.status === "sent" ? "✅" : email.status === "scheduled" ? "⏰" : email.status === "failed" ? "❌" : "📝"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate font-medium">{email.subject}</p>
                    <p className="text-xs text-text-muted truncate">
                      To: {email.prospectName} ({email.prospectEmail})
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-text-gray">
                      {email.opens || 0} opens · {Array.isArray(email.clicks) ? email.clicks.length : 0} clicks
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {email.sentAt ? new Date(email.sentAt).toLocaleDateString() : email.scheduledAt ? `Scheduled: ${new Date(email.scheduledAt).toLocaleDateString()}` : "Draft"}
                    </p>
                  </div>
                  <span className="text-text-muted text-xs shrink-0">
                    {expandedId === email.id ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded Details */}
                {expandedId === email.id && (
                  <div className="px-5 pb-4 border-t border-glass-border bg-surface-1" style={{ animation: "fade-up 0.15s ease-out" }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Status</p>
                        <p className="text-sm text-white capitalize">{email.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Opens</p>
                        <p className="text-sm text-white">{email.opens || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Clicks</p>
                        <p className="text-sm text-white">{Array.isArray(email.clicks) ? email.clicks.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Resend ID</p>
                        <p className="text-xs text-text-gray font-mono truncate">{email.resendId || "—"}</p>
                      </div>
                    </div>
                    {Array.isArray(email.clicks) && email.clicks.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-text-muted uppercase mb-2">Click Details</p>
                        <div className="space-y-1">
                          {email.clicks.map((click, i) => (
                            <div key={i} className="text-xs text-text-gray flex gap-2">
                              <span>{new Date(click.clickedAt).toLocaleString()}</span>
                              <span className="text-(--color-brand) truncate">{click.url}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
