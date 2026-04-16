"use client";

import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { createAgencyUpgradeCheckoutSession } from "../upgrade-actions";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await createAgencyUpgradeCheckoutSession();
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      alert(res.error || "Could not start checkout. Is STRIPE_SECRET_KEY set?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="text-center max-w-2xl mb-12">
        <div className="inline-block px-3 py-1 rounded-full bg-brand-subtle text-(--color-brand) text-xs font-semibold uppercase tracking-widest mb-6">
          Upgrade Required
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Unlock the Full Power of Agency OS
        </h1>
        <p className="text-lg text-text-muted">
          You&apos;ve reached the limit of your trial. Upgrade to continue managing your agency seamlessly.
        </p>
      </div>

      <div className="w-full max-w-lg glass-card p-8 relative overflow-hidden group hover:border-(--color-brand)/50 transition-colors">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-(--color-brand)/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Agency Pro</h2>
              <p className="text-sm text-text-muted">Everything you need to grow.</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">$49</p>
              <p className="text-sm text-text-muted">/month</p>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-(--color-brand) hover:bg-brand-hover text-white rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 group mb-8 disabled:opacity-50"
          >
            {loading ? "Redirecting to Stripe..." : "Upgrade Now"}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">What&apos;s included</h3>
            {[
              "Unlimited Client Portals",
              "Interactive Web Viewer for Design Previews",
              "Automated Stripe Invoicing & Subscriptions",
              "End-to-End Proposal & Contract Signing",
              "AI-Powered Search & Inbox Management",
              "Custom Domain & Branding",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="text-emerald-400" />
                </div>
                <span className="text-sm text-text-gray">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-6 text-sm text-text-muted">
        <span className="flex items-center gap-2">🔒 Secure checkout by Stripe</span>
        <span className="flex items-center gap-2">🔁 Cancel anytime</span>
      </div>
    </div>
  );
}
