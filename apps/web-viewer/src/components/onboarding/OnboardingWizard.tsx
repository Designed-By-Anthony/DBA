"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";

export default function OnboardingWizard() {
  const { createOrganization, setActive } = useOrganizationList();
  const [step, setStep] = useState(1);
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !createOrganization) return;
    
    setLoading(true);
    try {
      const org = await createOrganization({ name: agencyName });
      if (setActive) {
        await setActive({ organization: org.id });
      }
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Failed to create agency. Please try again.");
    }
    setLoading(false);
  };

  const handleFinish = () => {
    // Force a full reload to clear any Clerk cache and pass the layout checks
    window.location.assign("/admin");
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo/Branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--color-brand)] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-[var(--color-brand-glow)]">
          <span className="text-white text-2xl font-bold">OS</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Agency OS</h1>
        <p className="text-[var(--color-text-muted)]">
          Let&apos;s set up your workspace in just two clicks.
        </p>
      </div>

      <div className="glass-card p-6 relative overflow-hidden">
        {step === 1 ? (
          <form onSubmit={handleCreateAgency} className="animate-fade-in relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4">What is your agency&apos;s name?</h2>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Building2 className="text-[var(--color-text-muted)]" size={18} />
              </div>
              <input
                autoFocus
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Designed by Anthony"
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-xl text-white outline-none focus:border-[var(--color-brand)] transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !agencyName.trim()}
              className="w-full py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl font-medium transition-all shadow-lg flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  Create Agency Workspace
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="animate-fade-in text-center relative z-10">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You&apos;re all set!</h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Your CRM is ready. We&apos;ll guide you to add your first client next.
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl font-medium transition-all shadow-lg"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
