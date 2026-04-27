import { randomBytes } from "node:crypto";

// Unambiguous alphabet — no 0/O, no 1/I/l — so report IDs are phone-friendly.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function sanitize(input: string): string {
	return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Builds the 4-char prefix portion of a report ID.
 *
 * Fallback chain:
 *   1. First 4 alphanumeric chars of `company`
 *   2. First 4 alphanumeric chars of the URL hostname (minus `www.`)
 *   3. Literal `ANON`
 *
 * Short inputs are right-padded with `X` so the prefix is always exactly 4 chars.
 * Prefixes are normalized to uppercase so links are less error-prone when typed.
 */
export function buildPrefix(company: string, url: string): string {
	const fromCompany = sanitize(company || "").slice(0, 4);
	if (fromCompany.length === 4) return fromCompany;
	if (fromCompany.length > 0) return `${fromCompany}XXXX`.slice(0, 4);

	try {
		const host = new URL(url).hostname.replace(/^www\./, "");
		const fromHost = sanitize(host).slice(0, 4);
		if (fromHost.length === 4) return fromHost;
		if (fromHost.length > 0) return `${fromHost}XXXX`.slice(0, 4);
	} catch {
		// URL was malformed; fall through to ANON
	}

	return "ANON";
}

/** Generates a cryptographically-random 4-char suffix from the unambiguous alphabet. */
export function randomSuffix(): string {
	const bytes = randomBytes(4);
	let out = "";
	for (let i = 0; i < 4; i++) {
		out += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return out;
}

/** Full report ID. Caller is responsible for collision-checking against the report store. */
export function buildReportId(company: string, url: string): string {
	return `DBA-${buildPrefix(company, url)}${randomSuffix()}`;
}

/** Validates a report ID matches the format `DBA-XXXXYYYY` (8 alphanumeric chars after prefix). */
export function isValidReportId(id: string): boolean {
	return /^DBA-[A-Za-z0-9]{8}$/.test(id);
}
