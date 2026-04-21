import type * as React from "react";
import { z } from "zod";
import {
	getVerticalConfig,
	VERTICAL_IDS,
	type VerticalId,
} from "./vertical-config";

/**
 * `<VerticalSwitch />` — the Chameleon multiplexer.
 *
 * Renders a different "Feature Set" surface based on the tenant's vertical
 * (from `tenants.vertical_type`). Used by Agency OS dashboards + client
 * portals so one codebase sells as four separate products at the $250/mo
 * floor.
 *
 * Resolution order per-slot:
 *   1. Matching explicit prop (e.g. `restaurant`)
 *   2. `fallback` if the vertical has no registered slot
 *   3. `null` otherwise.
 *
 * All vertical-specific data must live in `leads.metadata` / `tenants.crm_config`
 * JSONB — do NOT widen the SQL schema to add vertical columns.
 */
export type VerticalSwitchProps = {
	vertical: VerticalId | string | null | undefined;
	agency?: React.ReactNode;
	service_pro?: React.ReactNode;
	restaurant?: React.ReactNode;
	florist?: React.ReactNode;
	fallback?: React.ReactNode;
};

function resolveVertical(
	input: VerticalId | string | null | undefined,
): VerticalId {
	const parsed = z.enum(VERTICAL_IDS).safeParse(input);
	return parsed.success ? parsed.data : "agency";
}

export function VerticalSwitch(
	props: VerticalSwitchProps,
): React.ReactElement | null {
	const id = resolveVertical(props.vertical);
	const node = props[id] ?? props.fallback ?? null;
	return <>{node}</>;
}

/**
 * Hook-free helper: resolve the active vertical config + module matrix
 * for any rendered surface. Useful when a component wants to branch on a
 * module id (e.g. `isModuleEnabled("backlink_audit")`) instead of a slot.
 */
export function useActiveVertical(
	vertical: VerticalId | string | null | undefined,
) {
	const id = resolveVertical(vertical);
	return { id, config: getVerticalConfig(id) };
}
