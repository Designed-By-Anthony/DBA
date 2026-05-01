/** US NANP area codes for the Mohawk Valley footprint (315). */
const MOHAWK_VALLEY_AREA_CODES = new Set(["315"]);

/**
 * Returns a CRM-friendly region tag when the phone indicates Mohawk Valley (315).
 */
export function regionTagFromPhone(phone: string): string | null {
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 10) return null;
	/** Skip leading country code 1 for NANP. */
	const national =
		digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
	if (national.length !== 10) return null;
	const area = national.slice(0, 3);
	return MOHAWK_VALLEY_AREA_CODES.has(area) ? "Mohawk Valley" : null;
}
