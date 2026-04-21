import type { PlanSuite } from "@dba/lead-form-contract";
import type { SidebarItem } from "@/lib/verticals";

/** Routes hidden for `starter` (same lead pipeline; upsell unlocks modules). */
const FULL_SUITE_ONLY_HREFS = new Set([
	"/admin/automations",
	"/admin/email/sequences",
	"/admin/billing",
	"/admin/pricebook",
]);

export function filterSidebarForPlanSuite(
	items: SidebarItem[],
	planSuite: PlanSuite,
): SidebarItem[] {
	if (planSuite === "full") return items;
	return items.filter((item) => !FULL_SUITE_ONLY_HREFS.has(item.href));
}
