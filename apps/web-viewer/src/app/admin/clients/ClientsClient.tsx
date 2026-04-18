"use client";

import { useState } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { toast } from "sonner";
import { Building2, Plus, ArrowRight, X, Palette, ExternalLink, Check } from "lucide-react";
import { createClientOrg, updateOrgBranding } from "./actions";
import { getAllVerticals, getVerticalConfig, type VerticalId } from "@/lib/verticals";

const ALL_VERTICALS = getAllVerticals();

type OrgData = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string;
  membersCount: number;
  createdAt: string;
  prospectCount: number;
  role: string;
  branding: Record<string, unknown> | null | undefined;
};

const BRAND_COLORS = [
  "#2563eb", "#3b82f6", "#06b6d4", "#10b981", "#eab308",
  "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#64748b",
];

export default function ClientsClient({ initialOrgs }: { initialOrgs: OrgData[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgVertical, setNewOrgVertical] = useState<VerticalId>("general");
  const [creating, setCreating] = useState(false);
  const { setActive } = useOrganizationList();

  // Branding editor state
  const [editingOrg, setEditingOrg] = useState<OrgData | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [brandInitial, setBrandInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewLinkLoading, setPreviewLinkLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || creating) return;

    setCreating(true);
    try {
      const result = await createClientOrg(newOrgName.trim(), newOrgVertical);
      if (!result.success) {
        toast.error(result.error);
        setCreating(false);
        return;
      }
      const newOrg = result;
      setOrgs((prev) => [
        ...prev,
        {
          id: newOrg.id,
          name: newOrg.name,
          slug: newOrg.slug,
          imageUrl: "",
          membersCount: 1,
          createdAt: new Date().toISOString(),
          prospectCount: 0,
          role: "org:admin",
          branding: { brandName: newOrgName.trim(), brandColor: "#2563eb", brandInitial: newOrgName.charAt(0).toUpperCase(), verticalTemplate: newOrgVertical },
        },
      ]);
      setNewOrgName("");
      setNewOrgVertical("general");
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create org:", err);
      toast.error("Something went wrong while creating the organization.");
    }
    setCreating(false);
  };

  const handleSwitch = async (orgId: string) => {
    if (!setActive) return;
    await setActive({ organization: orgId });
    window.location.assign("/");
  };

  const openBranding = (org: OrgData) => {
    const b = org.branding as Record<string, string> | null;
    setEditingOrg(org);
    setBrandName(b?.brandName || org.name);
    setBrandColor(b?.brandColor || "#2563eb");
    setBrandInitial(b?.brandInitial || org.name.charAt(0).toUpperCase());
    setPreviewEmail("");
    setPreviewLinkLoading(false);
  };

  const sendPreviewMagicLink = async () => {
    if (!editingOrg) return;
    const email = previewEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Enter an email to send a login link.");
      return;
    }
    setPreviewLinkLoading(true);
    try {
      const res = await fetch("/api/portal/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orgId: editingOrg.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || "Could not send login link.");
        return;
      }
      toast.success(
        "If that email belongs to a client in this org, we sent a login link.",
      );
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setPreviewLinkLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!editingOrg || saving) return;
    setSaving(true);
    try {
      await updateOrgBranding(editingOrg.id, {
        brandName: brandName.trim(),
        brandColor,
        brandInitial: brandInitial || brandName.charAt(0).toUpperCase(),
      });
      // Update local state
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === editingOrg.id
            ? { ...o, branding: { ...o.branding, brandName, brandColor, brandInitial } }
            : o
        )
      );
      setEditingOrg(null);
    } catch (err) {
      console.error("Failed to save branding:", err);
    }
    setSaving(false);
  };

  const roleLabel = (role: string) => {
    if (role === "org:admin") return "Admin";
    if (role === "org:member") return "Member";
    return role.replace("org:", "");
  };

  return (
    <div className="min-h-screen bg-(--color-surface-0) px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 size={24} className="text-(--color-brand)" />
            My Clients
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your client organizations. Each client has their own isolated CRM and portal.
          </p>
        </div>
        <button
          type="button"
          data-testid="clients-add-client-header"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-all shadow-(--color-brand-glow) hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Create org modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-client-title"
          data-testid="clients-add-modal"
        >
          <div className="glass-card p-6 w-full max-w-lg animate-scale-in relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 text-text-gray hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <h2 id="add-client-title" className="text-lg font-bold text-white mb-1">
              Add New Client
            </h2>
            <p className="text-xs text-text-muted mb-6">
              Create a new organization for your client. They&apos;ll get their own CRM, pipeline, and client portal.
            </p>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g., Sarah's Flower Shop"
                  autoFocus
                  className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand) transition-colors placeholder:text-text-gray"
                />
              </div>

              {/* Vertical Template Picker */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-2">
                  What kind of business?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_VERTICALS.map((v) => {
                    const VIcon = v.icon;
                    const selected = newOrgVertical === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setNewOrgVertical(v.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                          selected
                            ? "border-(--color-brand) bg-brand-subtle text-white ring-1 ring-(--color-brand)"
                            : "border-glass-border bg-surface-1 text-text-gray hover:text-white hover:bg-surface-2"
                        }`}
                      >
                        <VIcon size={20} className={selected ? "text-(--color-brand)" : ""} />
                        <span className="text-[10px] font-medium leading-tight">{v.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-muted mt-2">
                  {getVerticalConfig(newOrgVertical).description}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg bg-surface-2 text-white text-sm font-medium border border-glass-border hover:bg-surface-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOrgName.trim() || creating}
                  className="flex-1 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-all shadow-(--color-brand-glow) disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branding editor modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md animate-scale-in relative">
            <button
              type="button"
              onClick={() => setEditingOrg(null)}
              className="absolute top-4 right-4 text-text-gray hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-brand-subtle">
                <Palette size={18} className="text-(--color-brand)" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Portal Branding</h2>
                <p className="text-xs text-text-muted">
                  Customize how {editingOrg.name}&apos;s portal looks to their clients
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-surface-1 rounded-xl p-6 mb-6 border border-glass-border">
              <p className="text-[9px] text-text-muted uppercase tracking-widest mb-3">Portal Preview</p>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}99)` }}
                >
                  {brandInitial || brandName.charAt(0)?.toUpperCase() || "?"}
                </div>
                <p className="text-lg font-bold text-white">{brandName || "Client Portal"}</p>
                <p className="text-xs text-text-muted">Enter your email to access your portal</p>
                <label className="sr-only" htmlFor="portal-preview-email">
                  Client email for test login link
                </label>
                <input
                  id="portal-preview-email"
                  type="email"
                  autoComplete="email"
                  value={previewEmail}
                  onChange={(e) => setPreviewEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-(--color-surface-0) border border-glass-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-text-gray outline-none focus:border-(--color-brand)"
                />
                <button
                  type="button"
                  disabled={previewLinkLoading}
                  onClick={() => void sendPreviewMagicLink()}
                  className="w-full py-2 rounded-lg text-center text-white text-xs font-medium shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                  style={{ background: brandColor }}
                >
                  {previewLinkLoading ? "Sending…" : "Send Login Link"}
                </button>
                <p className="text-[10px] text-text-muted text-center leading-snug">
                  Uses the same flow as the live portal. Only emails that match a
                  prospect in this organization receive a link.
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                  Portal Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Client Portal"
                  className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                  Brand Initial
                </label>
                <input
                  type="text"
                  value={brandInitial}
                  onChange={(e) => setBrandInitial(e.target.value.slice(0, 2).toUpperCase())}
                  placeholder="S"
                  maxLength={2}
                  className="w-20 bg-surface-1 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white text-center outline-none focus:border-(--color-brand) transition-colors font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-2">
                  Brand Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrandColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${brandColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-(--color-surface-0) scale-110" : "hover:scale-105"}`}
                      style={{ background: color }}
                    >
                      {brandColor === color && <Check size={14} className="mx-auto text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                className="flex-1 py-2.5 rounded-lg bg-surface-2 text-white text-sm font-medium border border-glass-border hover:bg-surface-3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBranding}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-all shadow-lg disabled:opacity-50"
                style={{ background: brandColor }}
              >
                {saving ? "Saving..." : "Save Branding"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Org Grid */}
      {orgs.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <Building2 size={48} className="mx-auto mb-4 text-text-gray opacity-30" />
          <h3 className="text-lg font-semibold text-white mb-2">No clients yet</h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Add your first client to get started. Each client gets their own CRM, prospect pipeline, email tools, and a branded client portal.
          </p>
          <button
            type="button"
            data-testid="clients-add-client-empty"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-all shadow-(--color-brand-glow)"
          >
            <Plus size={16} />
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.map((org, i) => (
            <div
              key={org.id}
              className={`glass-card overflow-hidden animate-fade-up stagger-${Math.min(i + 1, 6)} group hover:-translate-y-1 transition-all duration-200`}
            >
              {/* Card header with brand color strip */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: (org.branding as Record<string, string>)?.brandColor || "var(--color-brand)",
                }}
              />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${(org.branding as Record<string, string>)?.brandColor || "#2563eb"}, ${(org.branding as Record<string, string>)?.brandColor || "#2563eb"}99)`,
                    }}
                  >
                    {(org.branding as Record<string, string>)?.brandInitial || org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-(--color-brand) transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      {roleLabel(org.role)} · Created {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                {(() => {
                  const vt = getVerticalConfig((org.branding as Record<string, string>)?.verticalTemplate);
                  return (
                    <>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-xs">{vt.emoji}</span>
                        <span className="text-[10px] text-text-muted font-medium">{vt.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-surface-2 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-white">{org.prospectCount}</p>
                          <p className="text-[9px] text-text-muted uppercase">{vt.terminology.prospects}</p>
                        </div>
                        <div className="bg-surface-2 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-white">{org.membersCount}</p>
                          <p className="text-[9px] text-text-muted uppercase">Team</p>
                        </div>
                        <div className="bg-surface-2 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-white">
                            {org.branding ? "✓" : "—"}
                          </p>
                          <p className="text-[9px] text-text-muted uppercase">Portal</p>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSwitch(org.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-(--color-brand-glow)"
                  >
                    <ArrowRight size={12} />
                    Open CRM
                  </button>
                  <button
                    onClick={() => openBranding(org)}
                    className="px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-gray hover:text-white text-xs font-medium border border-glass-border transition-colors"
                    title="Portal Branding"
                  >
                    <Palette size={14} />
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-gray hover:text-white text-xs font-medium border border-glass-border transition-colors"
                    title="Open Portal"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
