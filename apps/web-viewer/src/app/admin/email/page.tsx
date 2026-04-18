"use client";

import { useState, useEffect, useCallback } from "react";
import { getProspects, sendEmail, sendTestEmail } from "../actions";
import { sanitizeEmailPreviewHtml } from "@/lib/sanitize-email-preview-html";
import type { Prospect } from "@/lib/types";
import { emailTemplates } from "@/lib/theme.config";
import { useUser } from "@clerk/nextjs";

export default function EmailComposerPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent: number; errors: string[] } | null>(null);

  // Compose state
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editorMode, setEditorMode] = useState<"plaintext" | "html">("plaintext");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewProspectId, setPreviewProspectId] = useState<string | "">("");
  const { user } = useUser();

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

  const sendable = prospects.filter((p) => p.email && !p.unsubscribed);
  const filtered = sendable.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSendTest = async () => {
    if (!user || (!user.primaryEmailAddress && !user.emailAddresses[0])) {
      return alert("Could not fetch your email address from Clerk!");
    }
    if (!subject.trim()) return alert("Subject is required");
    if (!body.trim()) return alert("Email body is required");

    setSending(true);
    setResult(null);

    const overrideEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!overrideEmail) {
      alert('Could not find a valid email string');
      setSending(false);
      return;
    }

    try {
      const finalBody = editorMode === "plaintext" ? body.replace(/\n/g, '<br/>') : body;
      const previewList = selectedIds.size > 0 ? prospects.filter(p => selectedIds.has(p.id)) : filtered.slice(0, 5);
      const pTarget = previewList.find(p => p.id === previewProspectId) || previewList[0];

      const res = await sendTestEmail({
        prospectId: pTarget?.id,
        testEmailAddress: overrideEmail,
        subject,
        bodyHtml: finalBody,
        fromName: fromName || undefined,
        fromEmail: fromEmail || undefined,
      });

      if (res.success) {
        alert("✅ Test email sent perfectly! Check your inbox.");
      } else {
        alert("⚠️ Failed to send test: " + res.error);
      }
    } catch (err: unknown) {
      alert("⚠️ Request failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setSending(false);
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return alert("Select at least one recipient");
    if (!subject.trim()) return alert("Subject is required");
    if (!body.trim()) return alert("Email body is required");

    setSending(true);
    setResult(null);

    try {
      const finalBody = editorMode === "plaintext" 
        ? body.replace(/\n/g, '<br/>')  // Swift transpilation of raw typed carriages
        : body;

      const res = await sendEmail({
        prospectIds: Array.from(selectedIds),
        subject,
        bodyHtml: finalBody,
        fromName: fromName || undefined,
        fromEmail: fromEmail || undefined,
        scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      setResult(res);
      if (res.success) {
        setSelectedIds(new Set());
        setSubject("");
        setBody("");
        setScheduleMode(false);
        setScheduledAt("");
      }
    } catch (err: unknown) {
      setResult({
        success: false,
        sent: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Email Composer</h1>
        <p className="text-xs text-text-muted">
          CAN-SPAM compliant · Auto-appends unsubscribe link + physical address
        </p>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.success
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
          style={{ animation: "fade-up 0.2s ease-out" }}
        >
          {result.success ? (
            <p>✅ Successfully {scheduleMode ? "scheduled" : "sent"} {result.sent} email{result.sent !== 1 ? "s" : ""}!</p>
          ) : (
            <div>
              <p>⚠️ Sent {result.sent} email{result.sent !== 1 ? "s" : ""} with {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}:</p>
              <ul className="mt-2 space-y-1 text-xs">
                {result.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Recipient Selector */}
        <div className="lg:col-span-2 rounded-xl border border-glass-border bg-glass-bg overflow-hidden backdrop-blur-sm">
          <div className="px-4 py-3 border-b border-glass-border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-white">
                Recipients
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-(--color-brand) text-white">
                    {selectedIds.size}
                  </span>
                )}
              </h3>
              <button onClick={selectAll} className="text-xs text-(--color-brand) hover:underline">
                {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prospects..."
              className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            />
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-glass-border">
            {loading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">
                {search ? "No matching prospects" : "No prospects with email addresses"}
              </div>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-3 transition-colors ${
                    selectedIds.has(p.id) ? "bg-brand-subtle" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="accent-(--color-brand) shrink-0"
                  />
                  <div className="w-7 h-7 rounded-full bg-brand-subtle flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-text-muted truncate">{p.email}</p>
                  </div>
                  {p.company && (
                    <span className="text-[10px] text-text-muted hidden sm:block truncate max-w-[100px]">
                      {p.company}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right: Composer */}
        <div className="lg:col-span-3 space-y-4">
          {/* Template Selector */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-text-muted self-center mr-1">Templates:</span>
            {emailTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 border border-glass-border text-text-gray hover:text-white hover:border-glass-border-hover transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Subject */}
          {/* Traditional Composer */}
          <div className="rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm overflow-hidden">
            
            {/* Header Fields (To, From, Subject) */}
            <div className="border-b border-glass-border divide-y divide-glass-border text-sm">
              <div className="flex items-center px-4 py-2">
                <span className="w-16 text-text-muted font-semibold">To:</span>
                <div className="flex-1 text-white truncate">
                  {selectedIds.size === 0 
                    ? <span className="text-text-muted italic">Select recipients from the list...</span>
                    : <span className="bg-brand-subtle text-(--color-brand) px-2 py-0.5 rounded text-xs">{selectedIds.size} recipient{selectedIds.size !== 1 ? 's' : ''}</span>
                  }
                </div>
              </div>
              
              <div className="flex items-center px-4 py-2">
                <span className="w-16 text-text-muted font-semibold">From:</span>
                <input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Sender Name (Default)"
                  className="bg-transparent text-white outline-none placeholder-text-muted w-1/3 border-r border-glass-border mr-3 pr-3"
                />
                <input
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Sender Email (Default)"
                  className="bg-transparent text-white outline-none placeholder-text-muted flex-1"
                />
              </div>

              <div className="flex items-center px-4 py-2">
                <span className="w-16 text-text-muted font-semibold">Subject:</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  className="flex-1 bg-transparent text-white outline-none placeholder-text-muted font-medium"
                />
              </div>
            </div>

            {/* Formatting & Token Toolbar */}
            <div className="bg-surface-1 border-b border-glass-border px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => {
                  const ta = document.getElementById("email-body-textarea") as HTMLTextAreaElement;
                  if (!ta) return;
                  const s = ta.selectionStart; const e = ta.selectionEnd;
                  setBody(b => b.substring(0, s) + "<b>" + b.substring(s, e) + "</b>" + b.substring(e));
                  setEditorMode("html");
                }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-3 text-text-gray font-serif font-bold transition-colors">B</button>
                <button type="button" onClick={() => {
                  const ta = document.getElementById("email-body-textarea") as HTMLTextAreaElement;
                  if (!ta) return;
                  const s = ta.selectionStart; const e = ta.selectionEnd;
                  setBody(b => b.substring(0, s) + "<i>" + b.substring(s, e) + "</i>" + b.substring(e));
                  setEditorMode("html");
                }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-3 text-text-gray font-serif italic font-bold transition-colors">I</button>
                <button type="button" onClick={() => {
                  const ta = document.getElementById("email-body-textarea") as HTMLTextAreaElement;
                  if (!ta) return;
                  const s = ta.selectionStart; const e = ta.selectionEnd;
                  setBody(b => b.substring(0, s) + `<a href="#">` + (b.substring(s, e) || "link") + "</a>" + b.substring(e));
                  setEditorMode("html");
                }} className="w-7 h-7 flex items-center justify-center rounded text-sm hover:bg-surface-3 text-text-gray font-medium transition-colors underline">U</button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-text-muted">Insert:</span>
                <button type="button" onClick={() => setBody(b => b + "{{name}}")} className="text-[10px] px-2 py-1 rounded bg-brand-subtle text-(--color-brand) font-mono hover:bg-(--color-brand) hover:text-white transition-colors">{`{{name}}`}</button>
                <button type="button" onClick={() => setBody(b => b + "{{company}}")} className="text-[10px] px-2 py-1 rounded bg-brand-subtle text-(--color-brand) font-mono hover:bg-(--color-brand) hover:text-white transition-colors">{`{{company}}`}</button>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              <div className="flex justify-start items-center mb-2">
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-glass-border">
                  <button
                    onClick={() => { setEditorMode("plaintext"); setShowPreview(false); }}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all ${
                      editorMode === "plaintext" 
                        ? "bg-(--color-brand) text-white shadow-xl" 
                        : "text-text-gray hover:text-white"
                    }`}
                  >
                    Plain text
                  </button>
                  <button
                    onClick={() => setEditorMode("html")}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all ${
                      editorMode === "html" 
                        ? "bg-(--color-brand) text-white shadow-xl" 
                        : "text-text-gray hover:text-white"
                    }`}
                  >
                    Raw HTML
                  </button>
                  {editorMode === "html" && (
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all ${showPreview ? "bg-white text-black" : "text-(--color-brand)"}`}
                    >
                      {showPreview ? "Hide Preview" : "Preview"}
                    </button>
                  )}
                </div>
              </div>
              
              {showPreview && editorMode === "html" ? (
                (() => {
                  const previewList = selectedIds.size > 0 
                    ? prospects.filter(p => selectedIds.has(p.id)) 
                    : filtered.slice(0, 5); // Fallback to first 5 if none selected
                  
                  // Use specifically selected preview ID, or default to the first in the list
                  const pTarget = previewList.find(p => p.id === previewProspectId) || previewList[0];
                  
                  const pName = pTarget ? pTarget.name.split(' ')[0] : "Jane";
                  const pCompany = pTarget ? (pTarget.company || pTarget.name) : "Acme Corp";
                  const pTargetUrl = pTarget ? (pTarget.targetUrl || "https://acme.com") : "https://acme.com";

                  let previewHtml = body;
                  if (previewHtml) {
                    previewHtml = previewHtml.replace(/{{name}}/g, pName);
                    previewHtml = previewHtml.replace(/{{company}}/g, pCompany);
                    previewHtml = previewHtml.replace(/{{targetUrl}}/g, pTargetUrl);
                  }

                  return (
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-4 bg-surface-2 p-2 rounded-lg border border-glass-border">
                        <span className="text-xs text-text-muted">Previewing as:</span>
                        <select 
                          value={previewProspectId || (pTarget?.id || "")}
                          onChange={e => setPreviewProspectId(e.target.value)}
                          className="text-xs bg-surface-1 border border-glass-border rounded px-2 py-1 text-white outline-none"
                        >
                          {previewList.length > 0 ? previewList.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.company || 'No Company'})</option>
                          )) : (
                            <option value="">No prospects available</option>
                          )}
                        </select>
                      </div>
                      <div
                        className="prose prose-invert prose-sm max-w-none min-h-[300px] bg-white/5 rounded-lg p-4 text-sm"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeEmailPreviewHtml(previewHtml || "<em>Nothing to preview</em>"),
                        }}
                      />
                    </div>
                  );
                })()
              ) : (
                <textarea
                  id="email-body-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  placeholder={editorMode === "plaintext" ? "Type your message naturally here..." : `<p>Hi {{name}},</p>\n<p>I'd love to help {{company}} grow online...</p>`}
                  className={`w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none ${editorMode === "html" ? "font-mono" : "font-sans"}`}
                />
              )}
              <p className="text-[10px] text-text-muted mt-2">
                ✅ Links auto-wrapped for click tracking · Unsubscribe footer + physical address auto-appended
              </p>
            </div>
          </div>

          {/* Schedule Option */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.checked)}
                className="accent-(--color-brand)"
              />
              <span className="text-sm text-text-gray">Schedule for later</span>
            </label>
            {scheduleMode && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
              />
            )}
          </div>

          {/* Send Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="py-3 px-6 rounded-lg bg-surface-2 hover:bg-surface-3 text-white text-sm font-medium border border-glass-border transition-colors disabled:opacity-50"
            >
              🧪 Send Test to Me
            </button>
            <button
              onClick={handleSend}
              disabled={sending || selectedIds.size === 0}
              className="flex-1 py-3 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-(--color-brand-glow)"
            >
              {sending
                ? "Sending..."
                : scheduleMode
                ? `⏰ Schedule for ${selectedIds.size} recipient${selectedIds.size !== 1 ? "s" : ""}`
                : `📤 Send to ${selectedIds.size} recipient${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
