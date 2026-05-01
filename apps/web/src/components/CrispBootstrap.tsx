"use client";

import { useEffect } from "react";

const SCRIPT_ID = "crisp-client-script";
const DEFAULT_WEBSITE_ID = "427bf1d5-f2a9-408b-8cc6-0efc6489c676";

declare global {
    interface Window {
        $crisp?: unknown[];
        CRISP_WEBSITE_ID?: string;
        CRISP_RUNTIME_CONFIG?: { locale?: string };
        __dbaCrispLoaded?: boolean;
    }
}

/**
 * Crisp chat — Forced initialization.
 * Removed the interaction gate and cookie check to ensure 
 * site-wide availability during the 2026 launch phase.
 */
export function CrispBootstrap() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.__dbaCrispLoaded) return;

        const load = () => {
            if (window.__dbaCrispLoaded) return;
            
            window.__dbaCrispLoaded = true;
            window.$crisp = window.$crisp ?? [];
            window.CRISP_RUNTIME_CONFIG = {
                ...(window.CRISP_RUNTIME_CONFIG ?? {}),
                locale: "en",
            };
            
            // Priority: Env variable -> Hardcoded Default
            window.CRISP_WEBSITE_ID = 
                process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || DEFAULT_WEBSITE_ID;

            if (document.getElementById(SCRIPT_ID)) return;

            const s = document.createElement("script");
            s.id = SCRIPT_ID;
            s.src = "https://client.crisp.chat/l.js";
            s.async = true;
            (document.head ?? document.documentElement).appendChild(s);
        };

        // Fire immediately on mount
        load();

    }, []);

    return null;
}