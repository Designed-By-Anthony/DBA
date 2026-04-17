/**
 * Server-rendered Chameleon dashboard panel.
 *
 * Reads the tenant's `vertical_type` from Postgres, pulls lead metadata
 * from the `leads.metadata` JSONB column, and hands off to the right
 * `@dba/ui` feature set via `<VerticalSwitch />`.
 *
 * All vertical-specific data is stored in JSONB to keep the SQL schema lean.
 */
import { auth } from "@clerk/nextjs/server";
import {
  VerticalSwitch,
  AgencyFeatureSet,
  ServiceProFeatureSet,
  RestaurantFeatureSet,
  RetailFeatureSet,
  GenericLeadCard,
  safeParseVerticalLeadMetadata,
  type AgencyLeadMetadata,
  type ServiceProLeadMetadata,
  type RestaurantLeadMetadata,
  type RetailLeadMetadata,
  type RestaurantMenuItem,
  type ServiceProLead,
  type RestaurantOrder,
  type RetailLead,
  type VerticalId,
} from "@dba/ui";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { listSqlLeads } from "@/lib/lead-intake/sql";
import type { LeadRow } from "@dba/database";

type TenantCrmConfigMenu = { menu?: RestaurantMenuItem[] };

function typedMetadata<V extends VerticalId>(
  vertical: V,
  row: LeadRow,
): Record<string, unknown> {
  const parsed = safeParseVerticalLeadMetadata(vertical, row.metadata);
  return parsed.success ? (parsed.data as Record<string, unknown>) : {};
}

export default async function VerticalDashboard() {
  const { orgId: clerkOrgId } = await auth();
  const orgId =
    clerkOrgId ||
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? "dev-agency"
      : null);
  if (!orgId) return null;

  let tenant = null;
  try {
    if (clerkOrgId) tenant = await getTenantByOrgId(orgId);
  } catch (err) {
    console.error("[VerticalDashboard] tenant lookup failed:", err);
  }
  const vertical: VerticalId = (tenant?.verticalType as VerticalId) || "agency";

  let rows: LeadRow[] = [];
  try {
    rows = await listSqlLeads(orgId, 100);
  } catch (err) {
    console.error("[VerticalDashboard] lead lookup failed:", err);
  }

  const servicePro: ServiceProLead[] = rows.map((r) => ({
    id: r.prospectId,
    name: r.name,
    email: r.email,
    metadata: typedMetadata("service_pro", r) as ServiceProLeadMetadata,
  }));

  const restaurantOrders: RestaurantOrder[] = rows.map((r) => ({
    id: r.prospectId,
    prospectName: r.name,
    placedAt: r.createdAt,
    metadata: typedMetadata("restaurant", r) as RestaurantLeadMetadata,
  }));

  const retailLeads: RetailLead[] = rows.map((r) => ({
    id: r.prospectId,
    name: r.name,
    email: r.email,
    metadata: typedMetadata("florist", r) as RetailLeadMetadata,
  }));

  // Agency panel surfaces the most recent lead's audit metadata (dashboard hero).
  const latest = rows[0];
  const agencyMeta: AgencyLeadMetadata | null = latest
    ? (typedMetadata("agency", latest) as AgencyLeadMetadata)
    : null;

  const menu: RestaurantMenuItem[] =
    ((tenant?.crmConfig as TenantCrmConfigMenu | undefined)?.menu ?? []) as RestaurantMenuItem[];

  return (
    <div className="glass-card p-5 animate-fade-up" data-chameleon-vertical={vertical}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Vertical workspace</h3>
          <p className="text-xs text-text-muted">
            Rendering the {vertical.replace("_", " ")} feature set from{" "}
            <code>tenants.vertical_type</code>.
          </p>
        </div>
      </div>
      <VerticalSwitch
        vertical={vertical}
        agency={<AgencyFeatureSet metadata={agencyMeta} />}
        service_pro={<ServiceProFeatureSet leads={servicePro} />}
        restaurant={<RestaurantFeatureSet menu={menu} orders={restaurantOrders} />}
        florist={<RetailFeatureSet leads={retailLeads} />}
        fallback={<AgencyFeatureSet metadata={agencyMeta} />}
      />

      {rows.length > 0 ? (
        <div
          data-slot="recent-leads"
          className="mt-6 border-t border-glass-border pt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Recent leads
            </h4>
            <span className="text-[10px] text-white/50">{rows.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rows.slice(0, 6).map((r) => (
              <GenericLeadCard
                key={r.id}
                vertical={vertical}
                lead={{
                  prospectId: r.prospectId,
                  name: r.name,
                  email: r.email,
                  phone: r.phone ?? undefined,
                  source: r.source ?? undefined,
                  status: r.status,
                  createdAt: r.createdAt,
                  metadata: r.metadata as Record<string, unknown>,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
