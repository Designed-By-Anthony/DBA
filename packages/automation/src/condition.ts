/**
 * Tiny condition evaluator for the Automation Engine.
 * Reads dotted JSON paths from the event and applies the predicate operators.
 * All predicates are AND-ed; empty condition = always true.
 */
import type { AutomationCondition, AutomationEvent } from "./types";

function getPath(obj: unknown, path: string): unknown {
	const parts = path.split(".").filter(Boolean);
	let cur: unknown = obj;
	for (const p of parts) {
		if (cur == null) return undefined;
		if (typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[p];
	}
	return cur;
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a && b && typeof a === "object") {
		const ka = Object.keys(a as object);
		const kb = Object.keys(b as object);
		if (ka.length !== kb.length) return false;
		return ka.every((k) =>
			deepEqual(
				(a as Record<string, unknown>)[k],
				(b as Record<string, unknown>)[k],
			),
		);
	}
	return false;
}

export function evaluateCondition(
	condition: AutomationCondition | Record<string, unknown>,
	event: AutomationEvent,
): boolean {
	// Object with no predicates = always true.
	if (
		!("predicates" in condition) ||
		!Array.isArray(condition.predicates) ||
		condition.predicates.length === 0
	) {
		return true;
	}

	const root = { event };
	for (const p of condition.predicates) {
		const value = getPath(root, p.path);
		if ("equals" in p && p.equals !== undefined) {
			if (!deepEqual(value, p.equals)) return false;
		}
		if (p.contains !== undefined) {
			if (Array.isArray(value)) {
				if (!value.includes(p.contains)) return false;
			} else if (typeof value === "string" && typeof p.contains === "string") {
				if (!value.toLowerCase().includes(p.contains.toLowerCase()))
					return false;
			} else {
				return false;
			}
		}
		if (p.gt !== undefined) {
			if (typeof value !== "number" || !(value > p.gt)) return false;
		}
		if (p.lt !== undefined) {
			if (typeof value !== "number" || !(value < p.lt)) return false;
		}
		if (p.in !== undefined) {
			if (!p.in.some((v: unknown) => deepEqual(v, value))) return false;
		}
	}
	return true;
}
