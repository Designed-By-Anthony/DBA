/** US NANP area codes — Mohawk Valley (315). */
const MOHAWK_VALLEY_AREA_CODES = new Set(["315"]);

/** Capital Region overlay / legacy codes (518, 838). */
export const CAPITAL_REGION_AREA_CODES = ["518", "838"] as const;
const CAPITAL_REGION_SET = new Set<string>(CAPITAL_REGION_AREA_CODES);

/**
 * Returns a CRM-friendly region label from the caller's NANP number.
 * Mohawk Valley (315) wins if ever ambiguous with another rule.
 */
export function regionTagFromPhone(phone: string): string | null {
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 10) return null;
	/** Skip leading country code 1 for NANP. */
	const national =
		digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
	if (national.length !== 10) return null;
	const area = national.slice(0, 3);
	if (MOHAWK_VALLEY_AREA_CODES.has(area)) return "Mohawk Valley";
	if (CAPITAL_REGION_SET.has(area)) return "Capital Region";
	return null;
}

/** True if the Web-to-Lead description already has our Region prefix (avoid duplicates). */
export function descriptionAlreadyHasRegionPrefix(text: string): boolean {
	return /^\s*Region:\s*(Mohawk Valley|Capital Region)\b/i.test(text);
}
