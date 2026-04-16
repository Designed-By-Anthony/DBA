"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProspectById,
  updateProspect,
  getActivities,
  addNote,
  getEmailHistory,
  createClientFolderAction,
  createPaymentLinkAction,
  generateContractAction,
  getCrmTasksForProspect,
  createCrmTask,
  updateCrmTask,
  deleteCrmTask,
  listOtherProspectsWithSameEmail,
  mergeProspectsIntoKeep,
} from "../../actions";
import { toast } from "sonner";
import type { Prospect, Activity, EmailRecord, ProspectStatus, CrmTask } from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { dollarsToCents, centsToDollars, formatCents } from "@/lib/currency";
import ProspectSequenceEnroll from "../ProspectSequenceEnroll";

// --- Client Update Panel (inline component) ---
function ClientUpdatePanel({ prospectId, prospect, onSaved }: { prospectId: string; prospect: Prospect; onSaved: () => void }) {
  const [note, setNote] = useState((prospect as unknown as Record<string, unknown>).projectNotes as string || "");
  const [contractSigned, setContractSigned] = useState(!!(prospect as unknown as Record<string, unknown>).contractSigned);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProspect(prospectId, {
      projectNotes: note,
      contractSigned,
      contractStatus: contractSigned ? 'signed' : 'sent',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Write a status update for your client (e.g. 'We've finished the homepage design and are starting on the service pages')..."
        className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={contractSigned}
            onChange={(e) => setContractSigned(e.target.checked)}
            className="w-4 h-4 rounded accent-(--color-brand)"
          />
          <span className="text-xs text-text-muted">Contract signed</span>
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {saved ? '✅ Saved' : saving ? 'Saving...' : 'Push Update'}
        </button>
      </div>
    </div>
  );
}
// --- End Client Update Panel ---

function CrmTasksPanel({
  prospectId,
  onChanged,
}: {
  prospectId: string;
  onChanged: () => void;
}) {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getCrmTasksForProspect(prospectId);
      setTasks(t);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [prospectId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const addTask = async () => {
    if (!title.trim()) return;
    setBusy("add");
    const iso = dueAt ? new Date(dueAt).toISOString() : new Date().toISOString();
    const res = await createCrmTask(prospectId, { title: title.trim(), dueAt: iso });
    if (res.success) {
      setTitle("");
      await load();
      onChanged();
    }
    setBusy(null);
  };

  const toggle = async (task: CrmTask) => {
    setBusy(task.id);
    await updateCrmTask(prospectId, task.id, { completed: !task.completed });
    await load();
    onChanged();
    setBusy(null);
  };

  const remove = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    setBusy(taskId);
    await deleteCrmTask(prospectId, taskId);
    await load();
    onChanged();
    setBusy(null);
  };

  return (
    <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-3">Tasks & reminders</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Follow up, send proposal…"
          className="flex-1 min-w-0 bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand)"
        />
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="sm:w-56 bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand)"
        />
        <button
          type="button"
          onClick={() => void addTask()}
          disabled={busy === "add" || !title.trim()}
          className="px-4 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50"
        >
          {busy === "add" ? "…" : "Add"}
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-text-muted">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-text-muted">No tasks yet. Add a reminder to stay on top of this deal.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const overdue =
              !task.completed && new Date(task.dueAt).getTime() < new Date().getTime();
            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  overdue ? "border-amber-500/30 bg-amber-500/5" : "border-glass-border bg-surface-2/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => void toggle(task)}
                  disabled={busy === task.id}
                  className="mt-0.5 w-4 h-4 rounded accent-(--color-brand)"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? "line-through text-text-muted" : "text-white"}`}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Due{" "}
                    {new Date(task.dueAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {overdue && !task.completed ? <span className="text-amber-400 ml-2">Overdue</span> : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(task.id)}
                  disabled={busy === task.id}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const activityIcons: Record<string, string> = {
  form_submission: "📋",
  audit_completed: "📊",
  email_sent: "✉️",
  email_opened: "👀",
  email_clicked: "🔗",
  call_booked: "📞",
  call_completed: "✅",
  note_added: "📝",
  status_changed: "🔄",
  contract_sent: "📄",
  contract_signed: "✍️",
  payment_received: "💳",
  file_uploaded: "📂",
  ticket_created: "🎫",
  milestone_shared: "🚀",
};

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prospectId = params.id as string;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [stripeProducts, setStripeProducts] = useState<{id: string, name: string, price: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sameEmailOthers, setSameEmailOthers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [mergeBusy, setMergeBusy] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, a, e, stripeRes] = await Promise.all([
        getProspectById(prospectId),
        getActivities(prospectId),
        getEmailHistory(prospectId),
        import("../../actions/stripe").then(m => m.getStripeProducts())
      ]);
      setProspect(p);
      setActivities(a);
      setEmails(e);
      if (stripeRes && stripeRes.products) {
        setStripeProducts(stripeRes.products.map(prod => ({
          id: prod.id,
          name: prod.name,
          price: prod.default_price?.unit_amount || 0
        })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [prospectId]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  useEffect(() => {
    if (!prospectId) return;
    void listOtherProspectsWithSameEmail(prospectId).then(setSameEmailOthers);
  }, [prospectId, prospect?.email]);

  const handleMergePair = async (keepId: string, mergeId: string) => {
    if (
      !confirm(
        "Merge these records? History (emails, tickets, activities, tasks) will combine into the kept profile and the duplicate will be removed.",
      )
    ) {
      return;
    }
    setMergeBusy(true);
    try {
      const res = await mergeProspectsIntoKeep(keepId, mergeId);
      if (!res.success) {
        toast.error(
          res.error === "email_mismatch"
            ? "Emails must match to merge."
            : res.error === "forbidden"
              ? "Not allowed."
              : "Merge failed.",
        );
        return;
      }
      toast.success("Records merged.");
      setSameEmailOthers([]);
      if (keepId === prospectId) {
        await loadData();
      } else {
        router.push(`/admin/prospects/${keepId}`);
      }
    } finally {
      setMergeBusy(false);
    }
  };

  const handleStatusChange = async (newStatus: ProspectStatus) => {
    if (!prospect) return;
    setProspect({ ...prospect, status: newStatus });
    await updateProspect(prospectId, { status: newStatus });
    await loadData();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await addNote(prospectId, noteText.trim());
    setNoteText("");
    await loadData();
    setSavingNote(false);
  };

  const handleFieldUpdate = async (field: string, value: string | number | object) => {
    if (!prospect) return;
    setEditingField(null);
    const res = await updateProspect(prospectId, { [field]: value });
    if (!res.success && res.error === "duplicate_email") {
      toast.error("Another prospect already uses this email.");
      await loadData();
      return;
    }
    await loadData();
  };

  const handleGenerateContract = async () => {
    if (!prospect) return;
    setActionLoading("contract");
    try {
      const cp = prospect.customPricing;
      const down =
        cp?.downPaymentCents != null ? centsToDollars(cp.downPaymentCents) : 0;
      const completion =
        cp?.completionPaymentCents != null
          ? centsToDollars(cp.completionPaymentCents)
          : 0;
      let monthlyRetainer = 0;
      let retainerTierName = "—";
      const tierId = cp?.retainerTier;
      if (tierId) {
        const prod = stripeProducts.find((p) => p.id === tierId);
        if (prod) {
          monthlyRetainer = centsToDollars(prod.price);
          retainerTierName = prod.name;
        }
      }
      const crmTierName =
        cp?.crmTier === "advanced"
          ? "Advanced CRM ($50/mo)"
          : "Basic CRM (Free)";

      const res = await generateContractAction({
        prospectId,
        downPayment: down,
        completionPayment: completion,
        monthlyRetainer,
        retainerTierName,
        crmTierName,
      });
      if (res.docUrl) {
        toast.success("MSA generated — opening Google Doc");
        window.open(res.docUrl, "_blank", "noopener,noreferrer");
        await loadData();
      } else {
        toast.error(res.error || "Could not generate contract");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateFolder = async () => {
    setActionLoading('folder');
    const result = await createClientFolderAction(prospectId);
    if (result.folderUrl) {
      window.open(result.folderUrl, '_blank');
    } else {
      alert(result.error || 'Failed to create folder');
    }
    await loadData();
    setActionLoading(null);
  };

  const handleCreatePaymentLink = async (type: 'down_payment' | 'completion', amount: number) => {
    setActionLoading('payment');
    const result = await createPaymentLinkAction({
      prospectId,
      amount,
      type,
      description: `${type === 'down_payment' ? 'Down Payment' : 'Site Completion'} — ${prospect?.company || prospect?.name}`,
    });
    if (result.url) {
      try {
        await navigator.clipboard.writeText(result.url);
        alert('Payment link copied to clipboard!');
      } catch {
        alert(`Payment Link generated: ${result.url}`);
      }
    } else {
      alert(result.error || 'Failed to create payment link');
    }
    await loadData();
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-xl" />
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-text-muted">Prospect not found</p>
        <Link href="/admin/prospects" className="text-(--color-brand) text-sm hover:underline mt-4 inline-block">
          ← Back to Prospects
        </Link>
      </div>
    );
  }

  const stageMeta = pipelineStages.find((s) => s.id === prospect.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/admin/prospects" className="text-text-muted hover:text-white text-sm">
            ← Back
          </Link>
          <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-white text-lg font-bold">
            {prospect.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{prospect.name}</h1>
            <p className="text-sm text-text-muted">
              {prospect.company || prospect.email}
            </p>
            {stageMeta && (
              <p className="text-xs text-text-muted mt-1">
                Pipeline: {stageMeta.label} · {Math.round(stageMeta.probability * 100)}% weight
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/email?to=${prospect.id}`}
            className="px-4 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors shadow-(--color-brand-glow)"
          >
            ✉️ Send Email
          </Link>
          <select
            value={prospect.status}
            onChange={(e) => handleStatusChange(e.target.value as ProspectStatus)}
            className="bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white"
          >
            {pipelineStages.map((s) => (
              <option key={s.id} value={s.id} className="bg-surface-1">{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {sameEmailOthers.length > 0 && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-3 text-sm">
          <p className="text-amber-100 font-medium mb-2">
            Same email as another record{sameEmailOthers.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-2">
            {sameEmailOthers.map((d) => (
              <li
                key={d.id}
                className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-text-muted"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/prospects/${d.id}`}
                    className="text-white font-medium hover:text-(--color-brand)"
                  >
                    {d.name || d.id}
                  </Link>
                  <span className="text-xs opacity-80">{d.email}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={mergeBusy}
                    onClick={() => void handleMergePair(prospectId, d.id)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/25 text-amber-100 hover:bg-amber-500/35 disabled:opacity-50"
                  >
                    Merge into this record
                  </button>
                  <button
                    type="button"
                    disabled={mergeBusy}
                    onClick={() => void handleMergePair(d.id, prospectId)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-3 text-white hover:bg-surface-2 border border-glass-border disabled:opacity-50"
                  >
                    Keep theirs instead
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Email", value: prospect.email, field: "email", type: "email" },
                { label: "Phone", value: prospect.phone, field: "phone", type: "tel" },
                { label: "Company", value: prospect.company, field: "company", type: "text" },
                { label: "Website", value: prospect.website, field: "website", type: "url" },
                { label: "Staging URL", value: prospect.stagingUrl, field: "stagingUrl", type: "url" },
                { label: "Source", value: prospect.source, field: "source", type: "text" },
                { label: "Deal Value", value: prospect.dealValue ? `$${prospect.dealValue.toLocaleString()}` : "—", field: "dealValue", type: "number" },
              ].map((item) => (
                <div key={item.field} className="group">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{item.label}</p>
                  {editingField === item.field ? (
                    <input
                      autoFocus
                      defaultValue={item.field === "dealValue" ? prospect.dealValue : (prospect as unknown as Record<string, unknown>)[item.field] as string || ""}
                      type={item.type}
                      onBlur={(e) => {
                        const val = item.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                        handleFieldUpdate(item.field, val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = item.type === "number" ? parseFloat(e.currentTarget.value) || 0 : e.currentTarget.value;
                          handleFieldUpdate(item.field, val);
                        }
                        if (e.key === "Escape") setEditingField(null);
                      }}
                      className="w-full bg-surface-1 border border-(--color-brand) rounded px-2 py-1 text-sm text-white outline-none"
                    />
                  ) : (
                    <p
                      onClick={() => setEditingField(item.field)}
                      className="text-sm text-white cursor-pointer hover:bg-surface-3 rounded px-2 py-1 -mx-2 transition-colors"
                      title="Click to edit"
                    >
                      {item.value || <span className="text-text-muted italic">Click to add</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Tags */}
            {prospect.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Tags</p>
                <div className="flex gap-1.5 flex-wrap">
                  {prospect.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-brand-subtle text-white">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="mt-4 pt-4 border-t border-glass-border flex flex-wrap gap-3">
              {prospect.auditReportUrl && (
                <a href={prospect.auditReportUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                  📊 View Audit Report
                </a>
              )}
              {prospect.calendlyEventUrl && (
                <a href={prospect.calendlyEventUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">
                  📞 View Booking
                </a>
              )}
              {prospect.contractDocUrl && (
                <a href={prospect.contractDocUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  📄 View Contract
                </a>
              )}
              {prospect.driveFolderUrl && (
                <a href={prospect.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                  📂 Drive Folder
                </a>
              )}
            </div>
          </div>

          {/* Pipeline Stage Bar */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Pipeline Stage</h3>
            <div className="flex gap-1">
              {pipelineStages.map((stage) => {
                const isActive = stage.id === prospect.status;
                const idx = pipelineStages.findIndex((s) => s.id === prospect.status);
                const stageIdx = pipelineStages.findIndex((s) => s.id === stage.id);
                const isPast = stageIdx < idx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStatusChange(stage.id)}
                    className={`flex-1 py-2.5 rounded text-xs font-medium transition-all ${
                      isActive
                        ? "text-white shadow-md"
                        : isPast
                        ? "text-white/60"
                        : "text-text-muted hover:text-white"
                    }`}
                    style={{
                      backgroundColor: isActive ? stage.color : isPast ? `${stage.color}33` : "var(--color-surface-2)",
                    }}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>

          <CrmTasksPanel prospectId={prospectId} onChanged={loadData} />

          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Email sequence</h3>
            <p className="text-xs text-text-muted mb-3">
              Enroll this contact in a drip sequence. Due emails run on your cron or via Sequences → Run now.
            </p>
            <ProspectSequenceEnroll prospectId={prospectId} />
          </div>

          {/* Client-Visible Update */}
          <div className="rounded-xl border-(--color-brand)/30 bg-glass-bg p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Client Update</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-subtle text-(--color-brand)">
                Visible to client in portal
              </span>
            </div>
            <ClientUpdatePanel prospectId={prospectId} prospect={prospect} onSaved={loadData} />
          </div>

          {/* Pricing Settings */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Contract Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Retainer (Stripe)</p>
                <select
                  value={prospect.customPricing?.retainerTier || ''}
                  onChange={(e) => {
                    handleFieldUpdate('customPricing', { ...prospect.customPricing, retainerTier: e.target.value });
                  }}
                  className="w-full bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">No Retainer</option>
                  {stripeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCents(p.price)})</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">CRM Tier</p>
                <select
                  value={prospect.customPricing?.crmTier || 'free'}
                  onChange={(e) => {
                    const val = e.target.value as 'free' | 'advanced';
                    handleFieldUpdate('customPricing', { ...prospect.customPricing, crmTier: val });
                  }}
                  className="w-full bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="free">Basic CRM (Free)</option>
                  <option value="advanced">Advanced CRM ($50/mo)</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Down Payment</p>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={centsToDollars(prospect.customPricing?.downPaymentCents || 0)}
                  placeholder="e.g. 500"
                  onBlur={(e) => {
                    const cents = dollarsToCents(e.target.value);
                    handleFieldUpdate('customPricing', { ...prospect.customPricing, downPaymentCents: cents });
                  }}
                  className="w-full bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href={`/admin/prospects/${prospectId}/quote`}
                className="flex items-center justify-center px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
              >
                📄 Build Quote
              </Link>
              <button
                type="button"
                onClick={handleGenerateContract}
                disabled={actionLoading === "contract"}
                className="px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-violet-500/10 text-violet-300 border border-violet-500/25 hover:bg-violet-500/20 disabled:opacity-50"
              >
                {actionLoading === "contract"
                  ? "⏳ Generating..."
                  : "📜 Generate MSA"}
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={actionLoading === 'folder' || !!prospect.driveFolderUrl}
                className="px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {actionLoading === 'folder' ? '⏳ Creating...' : prospect.driveFolderUrl ? '✅ Folder Created' : '📂 Create Drive Folder'}
              </button>
              <button
                onClick={() => {
                  const amount = prompt('Down payment amount ($):', String(centsToDollars(prospect.customPricing?.downPaymentCents || 50000)));
                  if (amount) handleCreatePaymentLink('down_payment', parseFloat(amount));
                }}
                disabled={actionLoading === 'payment'}
                className="px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50"
              >
                {actionLoading === 'payment' ? '⏳...' : '💳 Down Payment Link'}
              </button>
              <button
                onClick={() => {
                  const amount = prompt('Completion payment amount ($):', String(centsToDollars(prospect.customPricing?.completionPaymentCents || 100000)));
                  if (amount) handleCreatePaymentLink('completion', parseFloat(amount));
                }}
                disabled={actionLoading === 'payment'}
                className="px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50"
              >
                {actionLoading === 'payment' ? '⏳...' : '💳 Completion Link'}
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              MSA uses Contract Pricing below (Google Docs template). Set{" "}
              <code className="text-text-gray">GOOGLE_DOCS_MSA_TEMPLATE_ID</code>{" "}
              and Drive folder env vars for production.
            </p>
          </div>

          {/* Email History */}
          <div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden backdrop-blur-sm">
            <div className="px-5 py-4 border-b border-glass-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">
                Email History
                {emails.length > 0 && <span className="ml-2 text-xs text-text-muted">({emails.length})</span>}
              </h3>
              <Link href={`/admin/email?to=${prospect.id}`} className="text-xs text-(--color-brand) hover:underline">
                Compose →
              </Link>
            </div>
            <div className="divide-y divide-glass-border">
              {emails.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">No emails sent yet</div>
              ) : (
                emails.map((email) => (
                  <div key={email.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-3 transition-colors">
                    <span className="text-lg">
                      {email.status === "sent" ? "✅" : email.status === "scheduled" ? "⏰" : "📝"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{email.subject}</p>
                      <p className="text-xs text-text-muted">
                        {email.opens || 0} opens · {Array.isArray(email.clicks) ? email.clicks.length : 0} clicks
                      </p>
                    </div>
                    <span className="text-xs text-text-muted">
                      {email.sentAt ? new Date(email.sentAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline + Notes */}
        <div className="space-y-6">
          {/* Quick Note */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Add a note about this prospect..."
              className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none mb-2"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || savingNote}
              className="w-full py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-white text-sm border border-glass-border transition-colors disabled:opacity-50"
            >
              {savingNote ? "Saving..." : "Add Note"}
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No activity yet</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[14px] top-0 bottom-0 w-px bg-glass-border" />

                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-surface-2 border border-glass-border flex items-center justify-center text-sm shrink-0 z-10">
                        {activityIcons[activity.type] || "•"}
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-sm text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{activity.description}</p>
                        )}
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(activity.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
