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

            {/* Modal - Shrunk max-w-2xl to max-w-lg, tightened padding to p-8 md:p-10 */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[rgb(var(--accent-bronze-rgb)/0.3)] bg-linear-to-br from-[rgb(18_20_26/0.98)] to-[rgb(10_12_18/0.98)] p-8 md:p-10 shadow-2xl">
                {/* Accent line */}
                <div className="absolute left-0 right-0 top-0 h-[2px] bg-linear-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

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
                    <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight text-white">
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