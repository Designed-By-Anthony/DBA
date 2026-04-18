"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

function shouldEnableObservability(hostname: string) {
  if (process.env.NODE_ENV !== "production") return false;
  return hostname === "dba-agency-os.vercel.app" || hostname.endsWith(".vercel.app");
}

export function VercelObservability() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEnabled(shouldEnableObservability(window.location.hostname));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
