"use client";

import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * Registers the service worker in production only (matches previous @serwist/next disable-in-dev behavior).
 */
export function PwaRoot({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "production") {
    return children;
  }
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
