"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getTicketSlaState } from "@/lib/ticket-sla";

interface Ticket {
  id: string;
  prospectId: string;
  prospectName: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  adminReply: string | null;
  messages: Array<{ id: string; from: string; content: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string | null;
}

function formatSlaHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 72) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function TicketSlaBadge({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return null;
  }
  const sla = getTicketSlaState(ticket.createdAt, ticket.priority, ticket.firstResponseAt);
  if (sla.kind === "met") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        SLA met
      </span>
    );
  }
  if (sla.kind === "breach") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30" title="First response overdue">
        SLA +{formatSlaHours(sla.hoursOver)}
      </span>
    );
  }
  if (sla.kind === "warning") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
        SLA {formatSlaHours(sla.hoursRemaining)} left
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-glass-border">
      SLA {formatSlaHours(sla.hoursRemaining)}
    </span>
  );
}

const statusColors: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-surface-2 text-text-muted border-glass-border",
};

const priorityColors: Record<string, string> = {
  urgent: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-text-muted",
};

async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch("/api/admin/tickets");
  if (!res.ok) return [];
  return res.json();
}

async function replyToTicket(ticketId: string, reply: string, status: string) {
  return fetch(`/api/admin/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminReply: reply, status }),
  });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState("in_progress");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    leadId: "",
    leadName: "",
    leadEmail: "",
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  const load = useCallback(async () => {
    const data = await fetchTickets();
    setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await replyToTicket(selected.id, reply.trim(), replyStatus);
      setReply("");
      const data = await fetchTickets();
      setTickets(data);
      setSelected(data.find((t) => t.id === selected.id) ?? null);
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.leadEmail || !createForm.subject || !createForm.description) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ leadId: "", leadName: "", leadEmail: "", subject: "", description: "", priority: "medium" });
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-text-muted mt-1">
            {openCount} open · {tickets.length} total
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-(--color-brand) text-white hover:bg-brand-hover transition-colors"
          >
            + New Ticket
          </button>
          {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-(--color-brand) text-white"
                  : "bg-surface-2 text-text-muted hover:text-white"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowCreate(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-2xl border border-glass-border bg-[#0d0e14]/95 backdrop-blur-xl shadow-[0_0_80px_rgba(37,99,235,0.08),0_24px_48px_rgba(0,0,0,0.6)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border bg-gradient-to-r from-surface-2/80 to-transparent rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-white">Create Ticket</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Open a support ticket for a client</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Client Name</label>
                  <input
                    placeholder="Jane Doe"
                    value={createForm.leadName}
                    onChange={(e) => setCreateForm({ ...createForm, leadName: e.target.value, leadId: createForm.leadId || `lead_${Date.now()}` })}
                    className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Client Email</label>
                  <input
                    type="email"
                    placeholder="jane@company.com"
                    value={createForm.leadEmail}
                    onChange={(e) => setCreateForm({ ...createForm, leadEmail: e.target.value })}
                    className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Subject</label>
                <input
                  placeholder="Brief description of the issue"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Description</label>
                <textarea
                  placeholder="Describe the issue or message to the client..."
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-3 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-glass-border bg-surface-0/30 rounded-b-2xl flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-gray">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as "low" | "medium" | "high" | "urgent" })}
                  className="bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand)"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="ml-auto px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-white hover:bg-surface-3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.leadEmail || !createForm.subject || !createForm.description}
                className="px-6 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-semibold transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(37,99,235,0.25)]"
              >
                {creating ? "Creating..." : "Create & Notify Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-glass-border bg-glass-bg p-8 text-center">
              <p className="text-3xl mb-2">🎫</p>
              <p className="text-sm text-text-muted">No tickets</p>
            </div>
          ) : (
            filtered.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => { setSelected(ticket); setReply(ticket.adminReply || ""); setReplyStatus(ticket.status); }}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selected?.id === ticket.id
                    ? "border-(--color-brand) bg-brand-subtle"
                    : "border-glass-border bg-glass-bg hover:border-(--color-brand)/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-white line-clamp-1">{ticket.subject}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${statusColors[ticket.status]}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-1">
                  <Link
                    href={`/admin/prospects/${ticket.prospectId}`}
                    className="hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ticket.prospectName}
                  </Link>
                </p>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-medium ${priorityColors[ticket.priority]}`}>
                      ● {ticket.priority}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <TicketSlaBadge ticket={ticket} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Ticket Detail + Reply */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="rounded-xl border border-glass-border bg-glass-bg p-12 text-center h-full flex flex-col items-center justify-center">
              <p className="text-4xl mb-3">🎫</p>
              <p className="text-text-muted text-sm">Select a ticket to view and reply</p>
            </div>
          ) : (
            <div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden">
              {/* Ticket header */}
              <div className="px-6 py-4 border-b border-glass-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">{selected.subject}</h2>
                    <p className="text-sm text-text-muted mt-0.5">
                      From{" "}
                      <Link href={`/admin/prospects/${selected.prospectId}`} className="text-(--color-brand) hover:underline">
                        {selected.prospectName}
                      </Link>{" "}
                      · {new Date(selected.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[selected.status]}`}>
                      {selected.status.replace("_", " ")}
                    </span>
                    <TicketSlaBadge ticket={selected} />
                  </div>
                </div>
              </div>

              {/* Message thread */}
              <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
                {selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.from === "admin" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      msg.from === "admin" ? "bg-(--color-brand)" : "bg-surface-3"
                    }`}>
                      {msg.from === "admin" ? "A" : "C"}
                    </div>
                    <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                      msg.from === "admin"
                        ? "bg-brand-subtle text-white"
                        : "bg-surface-2 text-text-gray"
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] opacity-50 mt-1">
                        {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {selected.adminReply && !selected.messages.find(m => m.from === "admin") && (
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-(--color-brand) flex items-center justify-center text-sm">A</div>
                    <div className="max-w-[75%] rounded-xl px-4 py-2.5 bg-brand-subtle text-white">
                      <p className="text-sm">{selected.adminReply}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply form */}
              <div className="px-6 pb-6 border-t border-glass-border pt-4 space-y-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply to the client..."
                  rows={3}
                  className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="open">Keep Open</option>
                    <option value="in_progress">Mark In Progress</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim() || sending}
                    className="flex-1 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-(--color-brand-glow)"
                  >
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
