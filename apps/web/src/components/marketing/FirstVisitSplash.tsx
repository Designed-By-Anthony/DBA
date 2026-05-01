"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dba_first_visit_shown_v1";

export function FirstVisitSplash() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if already shown
        const hasShown = localStorage.getItem(STORAGE_KEY);
        if (!hasShown) {
            // Show after short delay for better UX
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsOpen(false);
    };

    const handleContactClick = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        // Track the CTA
        if (typeof window !== "undefined") {
            const w = window as unknown as { dataLayer?: unknown[] };
            w.dataLayer?.push({
                event: "first_visit_splash_contact",
                cta_source: "first_visit_splash",
            });
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
                aria-label="Close splash"
            />

            {/* Modal — canonical glass surface (Phase 4 SEV-1 Linear/Stripe pivot).
                4% → 1% white gradient, micro-border at white/8, frosted blur,
                inset top-highlight is the new accent (replaces the heavy bronze line). */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-linear-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl p-8 md:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_32px_80px_-32px_rgba(0,0,0,0.6)]">
                {/* Sleek Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="splash-close-btn"
                    aria-label="Close"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="mb-4">
                    <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb)/0.9)]">
                        New: Micro SaaS Division
                    </p>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium tracking-[-0.035em] leading-[1.1] text-white">
                        Bespoke web apps & automations.
                    </h2>
                </div>

                <p className="mb-8 text-[0.95rem] leading-relaxed text-white/75">
                    From custom CRMs to complex API integrations—if your business needs it to scale, we can build it. 
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/contact"
                        onClick={handleContactClick}
                        className="btn-premium-primary flex-1 sm:flex-none"
                    >
                        Contact us →
                    </Link>
                    
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-[0.95rem] font-medium text-white/80 transition hover:bg-white/10"
                    >
                        Explore the site
                    </button>
                </div>
            </div>
        </div>
    );
}