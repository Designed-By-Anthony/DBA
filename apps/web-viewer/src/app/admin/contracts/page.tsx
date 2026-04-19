"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  FileCheck, Send, Eye, CheckCircle, Clock, PenTool,
  Search, RefreshCw, X, Plus, Shield,
} from "lucide-react";

type ContractRow = {
  id: string;
  contractNumber: string;
  prospectId: string | null;
  estimateId: string | null;
  status: string;
  htmlContent: string;
  signerName: string | null;
  signerEmail: string | null;
  signatureData: string | null;
  certificateHash: string | null;
  signedAt: string | null;
  consentGiven: boolean;
  sentAt: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof FileCheck }> = {
  draft: { label: "Draft", color: "#64748b", icon: FileCheck },
  sent: { label: "Sent", color: "#3b82f6", icon: Send },
  viewed: { label: "Viewed", color: "#f59e0b", icon: Eye },
  signed: { label: "Signed", color: "#10b981", icon: CheckCircle },
  expired: { label: "Expired", color: "#6b7280", icon: Clock },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewContract, setViewContract] = useState<ContractRow | null>(null);
  const [search, setSearch] = useState("");

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contracts");
      const data = await res.json();
      setContracts(data.contracts ?? []);
    } catch {
      toast.error("Failed to load contracts");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const filtered = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.contractNumber.toLowerCase().includes(q) || (c.prospectId?.toLowerCase().includes(q) ?? false);
  });

  async function handleSend(id: string) {
    try {
      await fetch("/api/admin/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "sent" }),
      });
      toast.success("Contract sent to prospect!");
      loadContracts();
    } catch {
      toast.error("Failed to send contract");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
              <FileCheck size={20} className="text-purple-400" />
            </div>
            Contracts
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Generate, send, and track e-signature contracts. ESIGN Act compliant.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={16} />
          New Contract
        </button>
      </div>

      {/* Compliance Badge */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
        <Shield size={16} className="text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-400/80">
          All contracts include SHA-256 document hashing, IP/user-agent capture, and timestamped consent — compliant with ESIGN Act & UETA.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand) transition-colors"
          />
        </div>
        <button onClick={loadContracts} className="p-2 rounded-lg border border-glass-border text-text-muted hover:text-white hover:bg-surface-2 transition-colors">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contracts", value: contracts.length, color: "#8b5cf6" },
          { label: "Awaiting Signature", value: contracts.filter((c) => c.status === "sent" || c.status === "viewed").length, color: "#f59e0b" },
          { label: "Signed", value: contracts.filter((c) => c.status === "signed").length, color: "#10b981" },
          { label: "Drafts", value: contracts.filter((c) => c.status === "draft").length, color: "#64748b" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-glass-border bg-surface-0/60 backdrop-blur-sm p-4">
            <p className="text-[11px] text-text-muted uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
            <div className="h-0.5 rounded-full mt-3" style={{ background: `linear-gradient(to right, ${stat.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-surface-0/60 backdrop-blur-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-surface-1/50">
              <th className="text-left py-3 px-4 text-text-muted font-medium">Contract #</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium">Prospect</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium">Status</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium">Signed By</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium">Created</th>
              <th className="text-right py-3 px-4 text-text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-glass-border/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-3.5 px-4"><div className="h-4 rounded bg-surface-2 animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <FileCheck size={40} className="mx-auto text-text-muted/30 mb-3" />
                  <p className="text-text-muted">No contracts yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Create a contract from an accepted estimate or start fresh.</p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const config = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = config.icon;
                return (
                  <tr key={c.id} className="border-b border-glass-border/50 hover:bg-surface-1/30 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-white font-medium">{c.contractNumber}</td>
                    <td className="py-3.5 px-4 text-text-muted">{c.prospectId || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{ background: `${config.color}20`, color: config.color }}>
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-xs">
                      {c.signerName ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-400" />
                          {c.signerName}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {c.status === "draft" && (
                          <button onClick={() => handleSend(c.id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400" title="Send">
                            <Send size={14} />
                          </button>
                        )}
                        <button onClick={() => setViewContract(c)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white" title="View">
                          <Eye size={14} />
                        </button>
                        {c.status === "signed" && c.certificateHash && (
                          <button
                            onClick={() => toast.success(`Certificate: ${c.certificateHash?.slice(0, 16)}...`)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                            title="View certificate hash"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateContractModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadContracts(); }}
        />
      )}

      {/* View/Sign Modal */}
      {viewContract && (
        <ViewContractModal
          contract={viewContract}
          onClose={() => setViewContract(null)}
          onSigned={() => { setViewContract(null); loadContracts(); }}
        />
      )}
    </div>
  );
}

// ── Create Contract Modal ──

function CreateContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [htmlContent, setHtmlContent] = useState(DEFAULT_CONTRACT_TEMPLATE);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!htmlContent.trim()) { toast.error("Contract content required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contract created!");
      onCreated();
    } catch {
      toast.error("Failed to create contract");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 border border-glass-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-glass-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck size={20} className="text-purple-400" />
            New Contract
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Contract Content (HTML)</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-lg bg-surface-1 border border-glass-border text-white text-sm font-mono resize-y focus:outline-none focus:border-(--color-brand)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-surface-1 border border-glass-border text-text-muted text-sm hover:text-white">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:brightness-110 shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View / Sign Contract Modal ──

function ViewContractModal({ contract, onClose, onSigned }: { contract: ContractRow; onClose: () => void; onSigned: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isSigned = contract.status === "signed";

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    ctx.beginPath();
    ctx.moveTo(point.clientX - rect.left, point.clientY - rect.top);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineTo(point.clientX - rect.left, point.clientY - rect.top);
    ctx.stroke();
  }

  function endDraw() { setIsDrawing(false); }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSign() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!signerName || !signerEmail) { toast.error("Name and email required"); return; }
    if (!consent) { toast.error("You must consent to electronic signature"); return; }

    const signatureData = canvas.toDataURL("image/png");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contract.id,
          signerName,
          signerEmail,
          signatureData,
          consentGiven: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signature failed");
      }
      toast.success("Contract signed successfully!");
      onSigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signature failed");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 border border-glass-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-glass-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{contract.contractNumber}</h2>
            <p className="text-xs text-text-muted">{isSigned ? `Signed by ${contract.signerName}` : "Awaiting signature"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Preview */}
          <div className="rounded-lg border border-glass-border bg-white text-black p-6 max-h-72 overflow-y-auto text-sm"
            dangerouslySetInnerHTML={{ __html: contract.htmlContent }} />

          {isSigned ? (
            /* Signed State — Show Audit Trail */
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Electronically Signed</span>
              </div>
              {contract.signatureData && (
                <div className="rounded-lg border border-glass-border bg-surface-1 p-4">
                  <p className="text-xs text-text-muted mb-2">Signature</p>
                  <img src={contract.signatureData} alt="Signature" className="h-16 invert" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-1"><span className="text-text-muted">Signer:</span> <span className="text-white ml-1">{contract.signerName}</span></div>
                <div className="p-3 rounded-lg bg-surface-1"><span className="text-text-muted">Email:</span> <span className="text-white ml-1">{contract.signerEmail}</span></div>
                <div className="p-3 rounded-lg bg-surface-1"><span className="text-text-muted">Signed:</span> <span className="text-white ml-1">{contract.signedAt ? new Date(contract.signedAt).toLocaleString() : "—"}</span></div>
                <div className="p-3 rounded-lg bg-surface-1"><span className="text-text-muted">Hash:</span> <span className="text-white ml-1 font-mono text-[10px]">{contract.certificateHash?.slice(0, 24)}...</span></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (!w) { toast.error("Pop-up blocked — allow pop-ups to download PDF"); return; }
                  w.document.write(`<!DOCTYPE html><html><head><title>${contract.contractNumber}</title>
                    <style>body{font-family:system-ui,sans-serif;padding:40px;color:#111}
                    .sig-block{margin-top:32px;border-top:1px solid #ddd;padding-top:16px}
                    .sig-img{height:60px;margin:8px 0}
                    .meta{font-size:12px;color:#666;margin:4px 0}
                    .hash{font-family:monospace;font-size:10px;color:#999;word-break:break-all}
                    @media print{body{padding:20px}}</style></head><body>
                    ${contract.htmlContent}
                    <div class="sig-block">
                      <p style="font-weight:bold;margin:0">Electronically Signed</p>
                      ${contract.signatureData ? `<img class="sig-img" src="${contract.signatureData}" alt="Signature"/>` : ""}
                      <p class="meta"><strong>Signer:</strong> ${contract.signerName ?? ""}</p>
                      <p class="meta"><strong>Email:</strong> ${contract.signerEmail ?? ""}</p>
                      <p class="meta"><strong>Signed:</strong> ${contract.signedAt ? new Date(contract.signedAt).toLocaleString() : ""}</p>
                      <p class="hash"><strong>Certificate Hash:</strong> ${contract.certificateHash ?? ""}</p>
                      <p class="meta" style="margin-top:12px;font-size:10px;color:#999">This document was signed electronically in compliance with the ESIGN Act and UETA.</p>
                    </div></body></html>`);
                  w.document.close();
                  setTimeout(() => { w.print(); }, 400);
                }}
                className="w-full py-2.5 rounded-xl bg-surface-1 border border-glass-border text-white text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
              >
                <FileCheck size={14} />
                Download as PDF
              </button>
            </div>
          ) : (
            /* Signing UI */
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PenTool size={16} className="text-purple-400" />
                Sign This Contract
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full legal name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand)"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand)"
                />
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">Draw your signature below</p>
                  <button onClick={clearSignature} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={120}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  className="w-full rounded-lg border-2 border-dashed border-glass-border bg-surface-1 cursor-crosshair touch-none"
                  style={{ height: 120 }}
                />
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-1 border border-glass-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-(--color-brand)"
                />
                <span className="text-xs text-text-muted leading-relaxed">
                  I agree to sign this document electronically. I understand that my electronic signature has the same legal effect as a handwritten signature under the ESIGN Act and UETA.
                </span>
              </label>

              <button
                onClick={handleSign}
                disabled={submitting || !consent || !signerName || !signerEmail}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Signing..." : "Sign Contract"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_CONTRACT_TEMPLATE = `<h1 style="margin:0 0 8px">Service Agreement</h1>
<p style="color:#666;font-size:14px">This Service Agreement ("Agreement") is entered into as of the date of electronic signature below.</p>
<h2 style="margin:16px 0 8px">1. Scope of Services</h2>
<p>The Provider agrees to deliver the services as outlined in the associated Estimate/Proposal.</p>
<h2 style="margin:16px 0 8px">2. Payment Terms</h2>
<p>Payment is due according to the invoice schedule generated upon contract execution.</p>
<h2 style="margin:16px 0 8px">3. Term and Termination</h2>
<p>This Agreement begins on the date of signature and continues until all services are completed or the agreement is terminated by either party with 30 days written notice.</p>
<h2 style="margin:16px 0 8px">4. Governing Law</h2>
<p>This Agreement shall be governed by the laws of the state in which the Provider operates.</p>`;
