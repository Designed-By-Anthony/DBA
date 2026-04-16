"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import type { PlanSuite } from "@dba/lead-form-contract";
import { getVerticalConfig, type VerticalConfig, type VerticalId } from "./verticals";
import { tenantDbVerticalToUiTemplate } from "./tenant-vertical-bridge";

type VerticalContextType = {
  vertical: VerticalConfig;
  loading: boolean;
  planSuite: PlanSuite;
};

const VerticalContext = createContext<VerticalContextType>({
  vertical: getVerticalConfig("general"),
  loading: true,
  planSuite: "full",
});

/**
 * Provides the current org's vertical template config to all child components.
 * Reads verticalTemplate from org_settings in Firestore via a lightweight API call.
 */
export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization();
  const [vertical, setVertical] = useState<VerticalConfig>(getVerticalConfig("general"));
  const [loading, setLoading] = useState(true);
  const [planSuite, setPlanSuite] = useState<PlanSuite>("full");

  const orgId = organization?.id;

  useEffect(() => {
    if (!orgId) {
      queueMicrotask(() => {
        setVertical(getVerticalConfig("general"));
        setPlanSuite("full");
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => setLoading(true));

    async function load() {
      try {
        const [brandingRes, sqlRes] = await Promise.all([
          fetch(`/api/portal/branding?org=${orgId}`),
          fetch("/api/admin/tenant-vertical", { credentials: "include" }),
        ]);

        let templateId: VerticalId = "general";
        let planSuite: PlanSuite = "full";

        if (brandingRes.ok) {
          const data = await brandingRes.json();
          templateId = (data.verticalTemplate || "general") as VerticalId;
          const ps = data.planSuite;
          planSuite = ps === "starter" ? "starter" : "full";
        }

        // Prefer Cloud SQL `tenants.vertical` (Clerk webhook) over Firestore branding when present.
        if (sqlRes.ok) {
          const sql = (await sqlRes.json()) as { vertical?: string | null };
          if (sql.vertical) {
            templateId = tenantDbVerticalToUiTemplate(sql.vertical);
          }
        }

        if (!cancelled) {
          setVertical(getVerticalConfig(templateId));
          setPlanSuite(planSuite);
        }
      } catch {
        // Fall back to general
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [orgId]);

  return (
    <VerticalContext.Provider value={{ vertical, loading, planSuite }}>
      {children}
    </VerticalContext.Provider>
  );
}

/**
 * Hook to access the current vertical config.
 * 
 * Usage:
 *   const { vertical } = useVertical();
 *   vertical.terminology.prospect  // "Lead", "Client", "Member", etc.
 *   vertical.pipelineStages        // trade-specific pipeline stages
 */
export function useVertical() {
  return useContext(VerticalContext);
}
