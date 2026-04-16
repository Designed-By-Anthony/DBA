import type { CSSProperties } from "react";
import { auth } from "@clerk/nextjs/server";
import { getTenantByOrgId } from "@/lib/tenant-db";
import KitchenDisplay from "./KitchenDisplay";
import JobEstimator from "./JobEstimator";
import RetailWorkbench from "./RetailWorkbench";

/**
 * Server wrapper: reads `tenant.vertical` + `tenant.config` from Postgres and renders engine chrome.
 * When `DATABASE_URL` is unset or no row exists, only `children` render (legacy Firestore-only mode).
 */
export default async function VerticalExperience({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth();
  if (!orgId) {
    return <>{children}</>;
  }

  const tenant = await getTenantByOrgId(orgId);
  const vertical = tenant?.vertical;
  const cfg = tenant?.config;
  const accent = cfg?.primaryColor ?? "#2563eb";

  const showKitchen =
    vertical === "restaurant" && (cfg?.showKitchenDisplay ?? false);
  const showEstimator =
    vertical === "service_pro" || Boolean(cfg?.customEstimator);
  const showRetailStrip = vertical === "retail";

  return (
    <div
      style={
        {
          "--tenant-accent": accent,
        } as CSSProperties
      }
    >
      {showKitchen ? (
        <div
          className="border-b border-t-2 border-glass-border bg-surface-1 px-4 py-3 lg:px-8"
          style={{ borderTopColor: accent }}
        >
          <KitchenDisplay />
        </div>
      ) : null}
      {showEstimator ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <JobEstimator />
        </div>
      ) : null}
      {showRetailStrip ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <RetailWorkbench />
        </div>
      ) : null}
      {children}
    </div>
  );
}
