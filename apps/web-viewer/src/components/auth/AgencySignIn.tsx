"use client";

import { useState, useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { BRAND_ASSETS } from "@dba/theme/brand";

const clerkAppearance = {
  elements: {
    rootBox: "mx-auto w-full max-w-[400px]",
    card: "bg-surface-1 border border-glass-border shadow-2xl",
    headerTitle: "text-white",
    headerSubtitle: "text-text-muted",
    socialButtonsBlockButton:
      "bg-white text-black hover:bg-gray-100 transition-all",
    formFieldLabel: "text-text-muted",
    formFieldInput: "bg-surface-2 border-glass-border text-white",
    footerActionLink: "text-(--color-brand) hover:text-brand-hover",
  },
} as const;

/**
 * Shared Clerk sign-in surface.
 *
 * @param inline — `true` when rendered from the admin layout (URL is `/admin/*`).
 *   Uses `routing="hash"` so Clerk doesn't require the URL to contain `/sign-in` segments.
 *   Default `false` → used on the dedicated `/sign-in` route with `routing="path"`.
 */
export function AgencySignIn({ inline = false }: { inline?: boolean }) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // If Clerk still hasn't mounted after 8s, show the retry button
      const clerkEl = document.querySelector(".cl-rootBox, [data-clerk-component]");
      if (!clerkEl) setShowRetry(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-surface-0) p-4 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[rgb(59_130_246/0.08)] -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-[hsl(221_70%_55%/0.06)] -bottom-32 -left-32" />

      <div className="relative text-center animate-scale-in w-full max-w-md">
        <div className="relative w-[140px] h-[42px] mx-auto mb-5">
          <Image
            src={BRAND_ASSETS.logo}
            alt="Designed by Anthony"
            width={280}
            height={84}
            className="w-full h-full object-contain object-left"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Agency OS</h1>
        <p className="text-sm text-text-muted mb-8">
          Sign in to access your dashboard
        </p>

        {/*
         * Loading skeleton — Clerk mounts async; on mobile the JS can take
         * a few seconds. Hidden via CSS once Clerk's root mounts.
         */}
        <div className="clerk-loading-skeleton mb-4">
          <div className="mx-auto w-full max-w-[400px] rounded-xl border border-glass-border bg-surface-1 p-6 space-y-4">
            <div className="h-10 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-10 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-10 rounded-lg bg-surface-2 animate-pulse w-1/2 mx-auto" />
            <p className="text-[11px] text-text-muted text-center pt-2">Loading sign-in...</p>
            {showRetry && (
              <div className="pt-2 space-y-2 animate-fade-in">
                <p className="text-xs text-amber-400">Sign-in is taking longer than expected.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-(--color-brand) text-white text-xs font-semibold hover:bg-brand-hover transition-all"
                >
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>

        {inline ? (
          <SignIn
            routing="hash"
            forceRedirectUrl="/admin"
            fallbackRedirectUrl="/admin"
            appearance={clerkAppearance}
          />
        ) : (
          <SignIn
            routing="path"
            path="/sign-in"
            forceRedirectUrl="/admin"
            fallbackRedirectUrl="/admin"
            appearance={clerkAppearance}
          />
        )}
      </div>
    </div>
  );
}
