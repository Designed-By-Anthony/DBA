import { auth } from "@clerk/nextjs/server";
import { getTenantByOrgId } from "@/lib/tenant-db";
import KitchenDisplay from "./KitchenDisplay";
import JobEstimator from "./JobEstimator";

/**
 * Server wrapper: reads `tenant.vertical` from Cloud SQL and renders vertical-specific CRM chrome.
 * When `DATABASE_URL` is unset or no row exists, only `children` render (legacy Firestore-only mode).
 */
export default async function VerticalExperience({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth();
  if (!orgId) {
    return <>{children}</>;
  }

  const tenant = await getTenantByOrgId(orgId);
  const vertical = tenant?.vertical;

  return (
    <>
      {vertical === "restaurant" ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <KitchenDisplay />
        </div>
      ) : null}
      {vertical === "roofer" ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <JobEstimator />
        </div>
      ) : null}
      {children}
    </>
  );
}
