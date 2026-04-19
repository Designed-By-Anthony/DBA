"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, CheckCircle, AlertTriangle, Loader2, CreditCard, Shield } from "lucide-react";

type ConnectStatus = {
  connectStatus: string | null;
  accountId: string | null;
  platformFeeBps: number | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  currentlyDue?: string[];
  error?: string;
};

export default function PaymentsPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/connect-account", { cache: "no-store" });
      if (res.ok) {
        setStatus(await res.json() as ConnectStatus);
      }
    } catch {
      // non-critical
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Check for onboarding return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") === "complete") {
      load();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [load]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect-account", { method: "POST" });
      const data = await res.json() as { onboardingUrl?: string; error?: string };
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch {
      // error handling
    }
    setConnecting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 bg-surface-2 rounded w-48" />
        <div className="h-64 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  const isActive = status?.connectStatus === "active";
  const isOnboarding = status?.connectStatus === "onboarding";
  const isRestricted = status?.connectStatus === "restricted";
  const hasAccount = !!status?.accountId;
  const feePct = ((status?.platformFeeBps ?? 250) / 100).toFixed(1);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Payment Processing</h1>
        <p className="text-xs text-text-muted mt-1">
          Connect your Stripe account to accept payments from clients
        </p>
      </div>

      {/* Connect Status Card */}
      <div className="rounded-xl border border-glass-border bg-surface-1 overflow-hidden">
        <div className="p-5 border-b border-glass-border flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface-3 text-text-gray'}`}>
            <CreditCard size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Stripe Connect</h2>
            <p className="text-[11px] text-text-muted">
              {isActive ? "Your account is fully set up and receiving payments" :
               isOnboarding ? "Complete your Stripe onboarding to start accepting payments" :
               isRestricted ? "Action required — your account has restrictions" :
               "Connect your Stripe account to start processing payments"}
            </p>
          </div>
          <StatusBadge status={status?.connectStatus ?? null} />
        </div>

        <div className="p-5 space-y-4">
          {!hasAccount && (
            <div className="text-center py-6">
              <CreditCard size={40} className="mx-auto mb-4 text-text-gray opacity-40" />
              <h3 className="text-sm font-semibold text-white mb-2">Accept Payments Online</h3>
              <p className="text-xs text-text-muted mb-6 max-w-sm mx-auto">
                Connect with Stripe to accept credit cards, bank transfers, and 135+ payment methods.
                You&apos;ll manage your own Stripe dashboard and payouts.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-6 py-3 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {connecting ? (
                  <><Loader2 size={16} className="animate-spin" /> Setting up...</>
                ) : (
                  <><CreditCard size={16} /> Connect with Stripe</>
                )}
              </button>
            </div>
          )}

          {isOnboarding && hasAccount && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Complete Onboarding</p>
                <p className="text-xs text-text-muted mt-1">
                  Finish setting up your Stripe account to start accepting payments.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {connecting ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  Continue Setup
                </button>
              </div>
            </div>
          )}

          {isRestricted && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Account Restricted</p>
                <p className="text-xs text-text-muted mt-1">
                  Your Stripe account requires attention. Visit the Stripe dashboard to resolve.
                </p>
                {status?.currentlyDue && status.currentlyDue.length > 0 && (
                  <p className="text-[10px] text-red-400 mt-2">
                    Items due: {status.currentlyDue.length}
                  </p>
                )}
              </div>
            </div>
          )}

          {isActive && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatusCard
                  label="Charges"
                  enabled={status?.chargesEnabled ?? false}
                  icon={<CreditCard size={14} />}
                />
                <StatusCard
                  label="Payouts"
                  enabled={status?.payoutsEnabled ?? false}
                  icon={<Shield size={14} />}
                />
                <StatusCard
                  label="Verified"
                  enabled={status?.detailsSubmitted ?? false}
                  icon={<CheckCircle size={14} />}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2 border border-glass-border">
                <div>
                  <p className="text-xs font-medium text-white">Platform Fee</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Applied to each transaction processed through your account
                  </p>
                </div>
                <span className="text-lg font-bold text-(--color-brand)">{feePct}%</span>
              </div>
            </>
          )}
        </div>

        {hasAccount && (
          <div className="p-4 border-t border-glass-border bg-surface-0/50 flex items-center justify-between">
            <p className="text-[10px] text-text-gray font-mono">
              Account: {status?.accountId}
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-(--color-brand) hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Stripe Dashboard <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-surface-1 border border-glass-border">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-(--color-brand) mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-white">Industry-standard security</p>
            <p className="text-[10px] text-text-muted mt-1">
              Stripe handles PCI compliance, fraud detection, and regulatory requirements.
              Your customer payment data never touches our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-3 text-text-gray">Not Connected</span>;
  }
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Active" },
    onboarding: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Onboarding" },
    restricted: { bg: "bg-red-500/15", text: "text-red-400", label: "Restricted" },
    disabled: { bg: "bg-red-500/15", text: "text-red-400", label: "Disabled" },
  };
  const s = map[status] ?? map.disabled;
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
}

function StatusCard({ label, enabled, icon }: { label: string; enabled: boolean; icon: React.ReactNode }) {
  return (
    <div className={`p-3 rounded-lg border text-center ${enabled ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-2 border-glass-border'}`}>
      <div className={`mx-auto mb-1.5 ${enabled ? 'text-emerald-400' : 'text-text-gray'}`}>{icon}</div>
      <p className="text-[10px] font-medium text-white">{label}</p>
      <p className={`text-[9px] mt-0.5 ${enabled ? 'text-emerald-400' : 'text-text-gray'}`}>
        {enabled ? "Enabled" : "Pending"}
      </p>
    </div>
  );
}
