"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-surface-0) p-4 relative overflow-hidden">
      {/* Floating orb decorations */}
      <div className="orb w-[500px] h-[500px] bg-[rgb(59_130_246/0.08)] -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-[hsl(221_70%_55%/0.06)] -bottom-32 -left-32" />

      <div className="relative text-center animate-scale-in">
        <div className="relative w-[140px] h-[42px] mx-auto mb-5">
          <Image
            src="/dba-logo.png"
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

        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface-1 border border-glass-border shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-text-muted",
              socialButtonsBlockButton: "bg-white text-black hover:bg-gray-100 transition-all",
              formFieldLabel: "text-text-muted",
              formFieldInput: "bg-surface-2 border-glass-border text-white",
              footerActionLink: "text-(--color-brand) hover:text-brand-hover",
            },
          }}
        />
      </div>
    </div>
  );
}
