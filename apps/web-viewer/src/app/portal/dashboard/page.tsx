"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationOptIn from "@/components/portal/NotificationOptIn";
import { brandConfig } from "@/lib/theme.config";

interface PortalData {
  prospect: {
    name: string;
    company: string;
    status: string;
    onboarding?: {
      contractSigned: boolean;
      downPaymentReceived: boolean;
      logoUploaded: boolean;
      photosUploaded: boolean;
      serviceDescriptions: boolean;
      domainAccess: boolean;
    };
    driveFolderUrl?: string;
    contractDocUrl?: string;
    pricingTier?: string;
    projectNotes?: string | null;
    contractSigned?: boolean;
    contractStatus?: string;
    stagingUrl?: string | null;
  };
  milestones: Array<{
    label: string;
    completed: boolean;
    current: boolean;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
}

const statusLabels: Record<string, { label: string; color: string; description: string }> = {
  lead: { label: "Inquiry Received", color: "#2563eb", description: "We've received your inquiry and will be in touch soon." },
  contacted: { label: "In Discussion", color: "#0ea5e9", description: "We're discussing your project requirements." },
  proposal: { label: "Proposal Sent", color: "#f59e0b", description: "Your proposal has been sent — review and sign to get started!" },
  dev: { label: "In Development", color: "#1d4ed8", description: "Your project is actively being built. Stay tuned for milestones!" },
  launched: { label: "Live!", color: "#10b981", description: "Your website is live and performing. Welcome aboard!" },
};

export default function PortalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "viewer">("dashboard");
  const [viewerDevice, setViewerDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        const res = await fetch("/api/portal/data");
        if (res.status === 401) {
          router.push("/portal");
          return;
        }
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {
        console.error("Failed to load portal data");
      }
      setLoading(false);
    };
    loadPortalData();
  }, [router]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    setSubmittingTicket(true);

    try {
      await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
        }),
      });
      setTicketSubject("");
      setTicketDescription("");
      // Reload data to show new ticket
      const res = await fetch("/api/portal/data");
      if (res.ok) setData(await res.json());
    } catch {
      alert("Failed to submit ticket");
    }
    setSubmittingTicket(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-text-muted mb-4">Session expired</p>
        <a href="/portal" className="text-(--color-brand) hover:underline text-sm">
          Log in again →
        </a>
      </div>
    );
  }

  const currentStatus = statusLabels[data.prospect.status] || statusLabels.lead;
  const onboarding = data.prospect.onboarding;
  const onboardingItems = onboarding
    ? [
        { label: "Contract Signed", done: onboarding.contractSigned },
        { label: "Down Payment Received", done: onboarding.downPaymentReceived },
        { label: "Logo Files Uploaded", done: onboarding.logoUploaded },
        { label: "Photo Assets Uploaded", done: onboarding.photosUploaded },
        { label: "Service Descriptions Provided", done: onboarding.serviceDescriptions },
        { label: "Domain Access Shared", done: onboarding.domainAccess },
      ]
    : [];

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {data.prospect.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-text-muted">
          {data.prospect.company || "Your"} project dashboard
        </p>
      </div>

      {/* Tabs Menu (Only show if staging URL is available) */}
      {data.prospect.stagingUrl && (
        <div className="flex border-b border-glass-border pb-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-(--color-brand) text-white"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("viewer")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "viewer"
                ? "border-(--color-brand) text-(--color-brand)"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            <span>💻</span> View Website
          </button>
        </div>
      )}

      {activeTab === "viewer" ? (
        // Web Viewer Mode
        <div className="flex-1 flex flex-col bg-surface-1 rounded-xl border border-glass-border overflow-hidden min-h-[600px]">
          {/* Viewer Toolbar */}
          <div className="flex justify-between items-center px-4 py-3 bg-surface-2 border-b border-glass-border">
            <div className="text-xs text-text-muted font-mono truncate max-w-[200px] sm:max-w-xs">
              {data.prospect.stagingUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewerDevice("mobile")}
                title="Mobile View"
                className={`p-1.5 rounded-lg transition-colors ${viewerDevice === "mobile" ? "bg-(--color-brand) text-white" : "text-text-gray hover:bg-surface-3"}`}
              >
                📱
              </button>
              <button
                onClick={() => setViewerDevice("tablet")}
                title="Tablet View"
                className={`p-1.5 rounded-lg transition-colors ${viewerDevice === "tablet" ? "bg-(--color-brand) text-white" : "text-text-gray hover:bg-surface-3"}`}
              >
                <span className="rotate-90 inline-block">📱</span>
              </button>
              <button
                onClick={() => setViewerDevice("desktop")}
                title="Desktop View"
                className={`p-1.5 rounded-lg transition-colors ${viewerDevice === "desktop" ? "bg-(--color-brand) text-white" : "text-text-gray hover:bg-surface-3"}`}
              >
                💻
              </button>
              <a
                href={data.prospect.stagingUrl!}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="p-1.5 ml-2 text-text-gray hover:text-white rounded-lg hover:bg-surface-3 transition-colors"
              >
                ↗️
              </a>
            </div>
          </div>
          {/* Iframe Container */}
          <div className="flex-1 bg-black/50 flex items-center justify-center p-4 overflow-hidden relative">
            <div 
              className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white shadow-2xl relative ${
                viewerDevice === "mobile" ? "w-[375px] h-[812px] rounded-4xl border-8 border-neutral-800" :
                viewerDevice === "tablet" ? "w-[768px] h-[1024px] rounded-2xl border-8 border-neutral-800" :
                "w-full h-full rounded shadow-none border-0"
              }`}
            >
              <iframe 
                src={data.prospect.stagingUrl!} 
                className="w-full h-full border-none bg-white rounded-inherit m-0 p-0 block"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="Staging Website Preview"
              />
            </div>
          </div>
        </div>
      ) : (
        // Dashboard Mode
        <div className="space-y-8 animate-fade-in">

      {/* Push Notification Opt-In */}
      <NotificationOptIn />

      {/* Status Banner */}
      <div
        className="rounded-xl p-6 border"
        style={{
          borderColor: `${currentStatus.color}40`,
          background: `linear-gradient(135deg, ${currentStatus.color}10, transparent)`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentStatus.color }}
          />
          <h2 className="text-lg font-bold text-white">{currentStatus.label}</h2>
        </div>
        <p className="text-sm text-text-muted">{currentStatus.description}</p>
      </div>

      {/* Admin project update — only shown when projectNotes is set */}
      {data.prospect.projectNotes && (
        <div className="rounded-xl border-(--color-brand)/30 bg-brand-subtle/20 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📢</span>
            <h3 className="text-sm font-semibold text-white">Latest Update</h3>
          </div>
          <p className="text-sm text-text-gray leading-relaxed">
            {data.prospect.projectNotes}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Milestones */}
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Project Milestones</h3>
          <div className="space-y-3">
            {data.milestones.map((milestone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    milestone.completed
                      ? "bg-emerald-500 text-white"
                      : milestone.current
                      ? "bg-(--color-brand) text-white animate-pulse"
                      : "bg-surface-2 text-text-muted"
                  }`}
                >
                  {milestone.completed ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    milestone.completed
                      ? "text-white line-through opacity-60"
                      : milestone.current
                      ? "text-white font-medium"
                      : "text-text-muted"
                  }`}
                >
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Checklist */}
        {onboardingItems.length > 0 && (
          <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-4">Onboarding Checklist</h3>
            <div className="space-y-3">
              {onboardingItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                      item.done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-glass-border"
                    }`}
                  >
                    {item.done && "✓"}
                  </div>
                  <span className={`text-sm ${item.done ? "text-white/60 line-through" : "text-white"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Drive folder link */}
            {data.prospect.driveFolderUrl && (
              <a
                href={data.prospect.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-brand-subtle text-white hover:bg-(--color-brand) transition-colors"
              >
                📂 Upload Assets to Google Drive
              </a>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
          <div className="space-y-2">
            {data.prospect.contractDocUrl && (
              <a
                href={data.prospect.contractDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors text-sm text-white"
              >
                📄 <span>View Contract</span>
              </a>
            )}
            {data.prospect.driveFolderUrl && (
              <a
                href={data.prospect.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors text-sm text-white"
              >
                📂 <span>Project Files</span>
              </a>
            )}
            <a
              href={`mailto:${brandConfig.supportEmail}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors text-sm text-white"
            >
              ✉️ <span>Contact Anthony</span>
            </a>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="rounded-xl border border-glass-border bg-glass-bg p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Support</h3>

          {/* Existing tickets */}
          {data.tickets.length > 0 && (
            <div className="space-y-2 mb-4">
              {data.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2"
                >
                  <span className="text-sm text-white truncate">{ticket.subject}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* New ticket form */}
          <form onSubmit={handleTicketSubmit} className="space-y-2">
            <input
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
            />
            <textarea
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              placeholder="Describe the issue (optional)..."
              rows={2}
              className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={!ticketSubject.trim() || submittingTicket}
              className="w-full py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-white text-sm border border-glass-border transition-colors disabled:opacity-50"
            >
              {submittingTicket ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
