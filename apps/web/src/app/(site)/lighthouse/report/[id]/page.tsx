"use client";

import type { AuditAiInsight, AuditData } from "@lh/auditReport";
import { AuditResults } from "@/lighthouse/components/AuditResults";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { 
    SECTION_SHELL_TECHNICAL, 
    SECTION_CONTAINER,
    SURFACE_CARD_TECHNICAL,
    CARD_HAS_TEXT_PAD
} from "@/design-system/sections";

const LABEL_STYLE = "text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb)/0.85)] mb-2";

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toAuditData(json: Record<string, unknown>): AuditData {
    const scores = (json.scores as Record<string, unknown>) ?? {};
    const metrics = (json.metrics as Record<string, unknown>) ?? {};
    const lead = (json.lead as Record<string, unknown>) ?? {};

    let aiInsight: AuditAiInsight | undefined;
    if (isObject(json.aiInsight)) {
        const ai = json.aiInsight;
        aiInsight = {
            executiveSummary: String(ai.executiveSummary ?? ""),
            conversionScore: Number(ai.conversionScore ?? 0),
            strengths: Array.isArray(ai.strengths) ? (ai.strengths as string[]) : [],
            weaknesses: Array.isArray(ai.weaknesses) ? (ai.weaknesses as string[]) : [],
            prioritizedActions: Array.isArray(ai.prioritizedActions)
                ? (ai.prioritizedActions as AuditAiInsight["prioritizedActions"])
                : [],
            copywritingAnalysis: String(ai.copywritingAnalysis ?? ""),
        };
    }

    let diagnostics: AuditData["diagnostics"];
    if (isObject(json.diagnostics)) {
        const diag = json.diagnostics;
        diagnostics = {
            failedAuditCount: Number(diag.failedAuditCount ?? 0),
            criticalIssue: String(diag.criticalIssue ?? ""),
        };
    }

    return {
        url: String(lead.url ?? ""),
        trustScore: Number(scores.trustScore ?? 0),
        performance: scores.performance == null ? null : Number(scores.performance),
        accessibility: scores.accessibility == null ? null : Number(scores.accessibility),
        bestPractices: scores.bestPractices == null ? null : Number(scores.bestPractices),
        seo: scores.seo == null ? null : Number(scores.seo),
        conversion: Number(scores.conversion ?? 0),
        metrics: {
            fcp: String(metrics.fcp ?? "—"),
            lcp: String(metrics.lcp ?? "—"),
            tbt: String(metrics.tbt ?? "—"),
            cls: String(metrics.cls ?? "—"),
        },
        psiDegradedReason: typeof json.psiDegradedReason === "string" ? json.psiDegradedReason : null,
        aiInsight,
        diagnostics,
        sitewide:
            isObject(json.sitewide) && isObject((json.sitewide as Record<string, unknown>).robotsTxt)
                ? (json.sitewide as unknown as AuditData["sitewide"])
                : undefined,
        backlinks: isObject(json.backlinks)
            ? (json.backlinks as unknown as AuditData["backlinks"])
            : undefined,
        indexCoverage: isObject(json.indexCoverage)
            ? (json.indexCoverage as unknown as AuditData["indexCoverage"])
            : undefined,
        places: isObject(json.places)
            ? (json.places as unknown as AuditData["places"])
            : undefined,
        competitors: Array.isArray(json.competitors)
            ? (json.competitors as AuditData["competitors"])
            : [],
    };
}

export default function LighthouseReportViewerPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : "";
    const [data, setData] = useState<AuditData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    buildPublicApiUrl(`/api/report/${encodeURIComponent(id)}`),
                    { cache: "no-store" },
                );
                let json: Record<string, unknown> = {};
                let jsonParseFailed = false;
                try {
                    json = (await res.json()) as Record<string, unknown>;
                } catch {
                    jsonParseFailed = true;
                }
                if (!res.ok) {
                    throw new Error(typeof json.error === "string" ? json.error : "Report not found.");
                }
                if (jsonParseFailed) throw new Error("Report data corrupt.");
                if (!cancelled) setData(toAuditData(json));
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (!id || error) {
        return (
            <MarketingChrome>
                <main className={SECTION_SHELL_TECHNICAL}>
                    <div className={`${SECTION_CONTAINER} max-w-2xl`}>
                        <div className={`${SURFACE_CARD_TECHNICAL} ${CARD_HAS_TEXT_PAD} text-center`}>
                            <p className={LABEL_STYLE}>Connection Error</p>
                            <p className="text-white/70 mb-8">{error || "Invalid link."}</p>
                            <Link href="/lighthouse" className="inline-flex rounded-xl bg-white/5 border border-white/10 px-8 py-3 text-sm font-bold text-white hover:bg-white/10">
                                Back to Scanner
                            </Link>
                        </div>
                    </div>
                </main>
            </MarketingChrome>
        );
    }

    if (!data) {
        return (
            <MarketingChrome>
                <main className={SECTION_SHELL_TECHNICAL}>
                    <div className={SECTION_CONTAINER}>
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[rgb(var(--accent-bronze-rgb))] animate-spin mb-4" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Retrieving Audit...</p>
                        </div>
                    </div>
                </main>
            </MarketingChrome>
        );
    }

    return (
        <MarketingChrome>
            <main className={SECTION_SHELL_TECHNICAL}>
                <div className={SECTION_CONTAINER}>
                    <AuditResults
                        data={data}
                        reportId={id}
                        onReset={() => router.push("/lighthouse")}
                    />
                </div>
            </main>
        </MarketingChrome>
    );
}