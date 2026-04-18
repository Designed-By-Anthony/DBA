"use client";

import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { shouldRegisterServiceWorker } from "@/lib/service-worker-host";

/**
 * Register only on canonical app hosts. Random Vercel deployment URLs can be
 * deployment-protected, which makes `/serwist/sw.js` return 401 and creates
 * noisy global ServiceWorker registration failures.
 */
export function PwaRoot({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={!shouldRegisterServiceWorker()}>
      {children}
    </SerwistProvider>
  );
}
