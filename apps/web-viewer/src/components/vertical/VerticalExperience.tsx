import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getVerticalConfig } from "@/lib/vertical-config";
import KitchenDisplay from "./KitchenDisplay";
import JobEstimator from "./JobEstimator";

/**
 * Server wrapper: reads `tenant.vertical` from Postgres (Neon) and renders vertical-specific CRM chrome.
 * When `DATABASE_URL` is unset or no row exists, only `children` render.
 */
export default async function VerticalExperience({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth();
  if (!orgId) {
    return <>{children}</>;
  }

  const { ui } = await getVerticalConfig(orgId);

  return (
    <>
      {ui.id === "food" ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <KitchenDisplay />
        </div>
      ) : null}
      {ui.id === "contractor" ? (
        <div className="border-b border-glass-border bg-surface-1 px-4 py-3 lg:px-8">
          <JobEstimator />
        </div>
      ) : null}
      {children}
    </>
  );
}
