import { Suspense } from "react";
import PortalLoginPage from "./PortalLoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal | Agency OS",
  description: "Access your project dashboard",
};

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 max-w-md w-full text-center animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] mx-auto mb-4" />
          <div className="h-5 bg-[var(--color-surface-2)] rounded w-40 mx-auto mb-2" />
          <div className="h-3 bg-[var(--color-surface-2)] rounded w-64 mx-auto" />
        </div>
      </div>
    }>
      <PortalLoginPage />
    </Suspense>
  );
}
