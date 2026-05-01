"use client";

import type { AuditData, AuditAiInsight } from "@lh/auditReport";
import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { ScoreRing } from "./ScoreRing";
import { 
    SURFACE_CARD_TECHNICAL, 
    CARD_HAS_TEXT_PAD 
} from "@/design-system/sections";

export type { AuditAiInsight, AuditData };

const LABEL_STYLE = "text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb)/0.85)] mb-2";
const HEADING_STYLE = "font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white mb-4";

function formatStars(rating: number | null | undefined): string {
    if (rating == null) return ""; 
    return `${rating.toFixed(1)}★`;
}

function ExecutiveSummaryBody({ text }: { text: string }) {
    return (
        <div className="text-[15px] leading-relaxed text-white/80 space-y-4">
            {text.split(/\n\n+/).filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
            ))}
        </div>
    );
}

export function AuditResults({
    data,
    reportId,
    onReset,
    contactEmail,
    contactName,
}: {
    data: AuditData;
    reportId?: string | null;
    onReset?: () => void;
    contactEmail?: string;
    contactName?: string;
}) {
    const router = useRouter();
    const [pdfStatus, setPdfStatus] = useState<"idle" | "generating" | "error">("idle");
    const prefersReduced = useReducedMotion();

    const handleDownloadPdf = useCallback(async () => {
        if (!reportId) return;
        setPdfStatus("generating");
        try {
            const res = await fetch(buildPublicApiUrl(`/api/report/${encodeURIComponent(reportId)}/pdf`));
            if (!res.ok) throw new Error("PDF failed");
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `audit-${reportId}.pdf`;
            a.click();
            setPdfStatus("idle");
        } catch { setPdfStatus("error"); }
    }, [reportId]);

    const handlePrintView = useCallback(() => {
        if (!reportId) return;
        window.open(`/lighthouse/report/${encodeURIComponent(reportId)}/print`, "_blank");
    }, [reportId]);

    return (
        <MotionDiv
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_360px] items-start">
                <div>
                    <p className={LABEL_STYLE}>Analysis Complete</p>
                    <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                        System Report
                    </h1>
                    <p className="text-xl text-white/50 leading-relaxed max-w-2xl">
                        Deep-scan results for <span className="text-white">{data.url}</span>. 
                    </p>
                </div>
                
                <div className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD} bg-white/[0.02]`}>
                    <p className="text-[11px] font-bold uppercase text-white/30 mb-2">Deliverables</p>
                    <div className="space-y-3">
                         <button 
                            onClick={handleDownloadPdf} 
                            disabled={pdfStatus === "generating"}
                            className="w-full rounded-xl bg-[rgb(var(--accent-bronze-rgb))] py-3 text-sm font-bold text-black hover:brightness-110 transition-all disabled:opacity-50"
                         >
                            {pdfStatus === "generating" ? "Generating..." : "Download PDF Report"}
                         </button>
                         <button 
                            onClick={handlePrintView}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
                         >
                            Print Full Layout
                         </button>
                    </div>
                </div>
            </div>

            <div className="mb-20 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
                {[
                    { val: data.trustScore, lab: "Trust" },
                    { val: data.performance, lab: "Performance" },
                    { val: data.accessibility, lab: "A11y" },
                    { val: data.bestPractices, lab: "Best Practices" },
                    { val: data.seo, lab: "SEO" },
                    { val: data.conversion, lab: "Conversion" },
                ].map((s) => (
                    <ScoreRing key={s.lab} score={s.val} label={s.lab} />
                ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-10">
                    <section className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD}`}>
                        <p className={LABEL_STYLE}>Strategic Overview</p>
                        <h2 className={HEADING_STYLE}>Executive Summary</h2>
                        <ExecutiveSummaryBody text={data.aiInsight?.executiveSummary || "No summary available."} />
                    </section>

                    <section className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD}`}>
                        <p className={LABEL_STYLE}>Impact Roadmap</p>
                        <h2 className={HEADING_STYLE}>Priority Actions</h2>
                        <div className="grid gap-4">
                            {data.aiInsight?.prioritizedActions?.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/5 transition-colors hover:bg-white/[0.05]">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgb(var(--accent-bronze-rgb)/0.1)] text-[rgb(var(--accent-bronze-rgb))] flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="text-[16px] font-semibold text-white/90 mb-1">{item.action}</p>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{item.impact} Impact</span>
                                            <span className="text-[10px] font-bold text-white/20">•</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{item.effort} Effort</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="lg:col-span-4 space-y-10">
                    <div className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD}`}>
                        <p className={LABEL_STYLE}>Technical Health</p>
                        <h3 className="text-xl font-bold text-white mb-6">Lab Vitals</h3>
                        <div className="space-y-5">
                            {[
                                { l: "First Contentful Paint", v: data.metrics?.fcp },
                                { l: "Largest Contentful Paint", v: data.metrics?.lcp },
                                { l: "Total Blocking Time", v: data.metrics?.tbt },
                                { l: "Cumulative Layout Shift", v: data.metrics?.cls },
                            ].map(m => (
                                <div key={m.l} className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-xs font-medium text-white/40">{m.l}</span>
                                    <span className="text-sm font-bold text-[rgb(var(--accent-bronze-rgb))]">{m.v || "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD} bg-[rgb(var(--accent-bronze-rgb)/0.03)]`}>
                        <p className={LABEL_STYLE}>Market Signals</p>
                        <h3 className="text-xl font-bold text-white mb-4">Local Visibility</h3>
                        <p className="text-2xl font-bold text-white mb-1">
                            {formatStars(data.places?.rating)}
                        </p>
                        <p className="text-sm text-white/40">
                            Based on {data.places?.userRatingCount ?? 0} verified reviews.
                        </p>
                    </div>
                </aside>
            </div>

            <div className="mt-24 border-t border-white/10 pt-16 text-center">
                <button 
                    onClick={() => { if(onReset) onReset(); else router.push('/lighthouse'); }}
                    className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 hover:text-[rgb(var(--accent-bronze-rgb))] transition-colors"
                >
                    ← Run New Scan
                </button>
            </div>
        </MotionDiv>
    );
}