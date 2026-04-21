const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeText(input: unknown, maxLength = 160): string {
	if (typeof input !== "string") {
		return "";
	}

	return input.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function normalizeEmail(input: unknown): string | null {
	if (typeof input !== "string") {
		return null;
	}

	const value = input.trim().toLowerCase();
	if (!value || value.length > 320 || /[\r\n]/.test(value)) {
		return null;
	}

	return SIMPLE_EMAIL_REGEX.test(value) ? value : null;
}

export function normalizeHttpUrl(input: unknown): string | null {
	if (typeof input !== "string") {
		return null;
	}

	const raw = input.trim();
	if (!raw || raw.length > 2048 || /[\r\n]/.test(raw)) {
		return null;
	}

	const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

	try {
		const url = new URL(candidate);
		if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
			return null;
		}

		url.hash = "";
		return url.toString();
	} catch {
		return null;
	}
}

export function escapeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
