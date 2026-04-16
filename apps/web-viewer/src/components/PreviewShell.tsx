"use client";

import { useState } from "react";
import { clsx } from "clsx";

type DeviceType = "desktop" | "tablet" | "mobile";

export default function PreviewShell({ clientName, targetUrl }: { clientName: string, targetUrl: string }) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  const getWidthClass = () => {
    switch (device) {
      case "mobile": return "max-w-[375px]";
      case "tablet": return "max-w-[768px]";
      case "desktop": return "max-w-full";
    }
  };

  const handleCopy = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("device", device);
    navigator.clipboard.writeText(url.toString());
    alert("Shareable link copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-text-white overflow-hidden font-main">
      {/* Top Header / Agency Branding */}
      <header className="flex-none h-16 sm:h-20 border-b border-white/5 bg-bg-ink/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10 relative">
        
        {/* Left: Branding */}
        <div className="flex flex-col">
          <span className="text-[0.65rem] sm:text-xs font-semibold text-accent-brass uppercase tracking-[0.25em] mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            Client Preview
          </span>
          <h1 className="text-lg sm:text-xl font-display font-bold text-text-cream leading-none tracking-tight">
            {clientName} <span className="text-white/20 px-2 font-light">|</span> Designed by Anthony
          </h1>
        </div>

        {/* Center: Device Toggles */}
        <div className="hidden md:flex items-center gap-1 bg-[#090f18]/60 p-1 rounded-full border border-white/5 shadow-inner">
          <button 
            onClick={() => setDevice("desktop")}
            className={clsx(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300",
              device === "desktop" ? "bg-accent-blue/10 text-[#bfdbfe] shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-accent-blue/20" : "text-text-gray hover:text-text-cream border border-transparent"
            )}
          >
            Desktop
          </button>
          <button 
            onClick={() => setDevice("tablet")}
            className={clsx(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300",
              device === "tablet" ? "bg-accent-blue/10 text-[#bfdbfe] shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-accent-blue/20" : "text-text-gray hover:text-text-cream border border-transparent"
            )}
          >
            Tablet
          </button>
          <button 
            onClick={() => setDevice("mobile")}
            className={clsx(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300",
              device === "mobile" ? "bg-accent-blue/10 text-[#bfdbfe] shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-accent-blue/20" : "text-text-gray hover:text-text-cream border border-transparent"
            )}
          >
            Mobile
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-display font-semibold rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 text-text-cream shadow-[0_18px_34px_-24px_rgba(2,6,23,0.9)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Link
          </button>
        </div>
      </header>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-0 sm:p-8 bg-bg-deeper/50">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Iframe wrapper - acting as the "Device Frame" */}
        <div 
          className={clsx(
            "relative w-full h-full bg-[#030407] overflow-hidden transition-[max-width,border-radius] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col ring-1 ring-white/5",
            getWidthClass(),
            device === "desktop" ? "shadow-none sm:rounded-xl ring-0" : "sm:rounded-[2.5rem] shadow-[0_28px_70px_-34px_rgba(0,0,0,0.8)] border-[6px] border-[#1a1c23] m-4 sm:m-0 h-[calc(100%-2rem)] sm:h-full"
          )}
        >
          {device !== "desktop" && (
             <div className="absolute top-0 inset-x-0 h-6 w-full flex items-center justify-center z-20 pointer-events-none">
                <div className="w-16 h-1.5 bg-black rounded-full mt-1.5 opacity-80 backdrop-blur-sm shadow-sm border border-white/5" />
             </div>
          )}
          <div className="flex-1 w-full h-full relative z-10 bg-white">
            <iframe 
              src={targetUrl} 
              className="absolute inset-0 w-full h-full border-0 bg-white"
              title={`${clientName} Preview`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
