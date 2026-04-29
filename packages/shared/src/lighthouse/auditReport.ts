import type { IndexCheckResult } from "./lib/indexCheck";
import type { MozMetrics } from "./lib/mozAnalysis";
import type { Competitor, PlacesResult } from "./lib/places";
import type { SitewideScanResult } from "./lib/sitewideScan";

export interface AuditAiInsight {
	executiveSummary: string;
	conversionScore: number;
	strengths: string[];
	weaknesses: string[];
	prioritizedActions: Array<{
		priority: number;
		action: string;
		impact: "high" | "medium" | "low";
		effort: "high" | "medium" | "low";
	}>;
	copywritingAnalysis: string;
}

export interface AuditData {
	url: string;
	trustScore: number;
	/** `null` when PageSpeed lab data was unavailable (partial report). */
	performance: number | null;
	accessibility: number | null;
	bestPractices: number | null;
	seo: number | null;
	conversion: number;
	metrics: {
		fcp: string;
		lcp: string;
		tbt: string;
		cls: string;
	};
	/** Set when lab scores were skipped or degraded (e.g. PSI timeout). */
	psiDegradedReason?: string | null;
	aiInsight?: AuditAiInsight;
	diagnostics?: { failedAuditCount: number; criticalIssue: string };
	sitewide?: SitewideScanResult;
	backlinks?: MozMetrics;
	indexCoverage?: IndexCheckResult;
	places?: PlacesResult;
	competitors?: Competitor[];
}
