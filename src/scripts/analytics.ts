export type AnalyticsEventProperties = Record<
	string,
	string | number | boolean | null | undefined
>;

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (
			command: string,
			targetId: string,
			configOrField?: Record<string, unknown> | (() => void) | string,
			callback?: (value: unknown) => void,
		) => void;
		__dbaAnalyticsEnabled?: boolean;
	}
}

export const GA_MEASUREMENT_ID = "G-4RSTBMRHDW";

export function appendAsyncScript(id: string, src: string): void {
	if (document.getElementById(id)) return;

	const script = document.createElement("script");
	script.id = id;
	script.async = true;
	script.src = src;
	document.head.appendChild(script);
}

export function pushAnalyticsEvent(
	event: string,
	payload: AnalyticsEventProperties = {},
): void {
	if (window.__dbaAnalyticsEnabled !== true) return;
	if (typeof window.gtag !== "function") return;
	window.gtag("event", event, payload);
}

export function initDeferredThirdPartyLoader(): void {
	// Marketing shell (Next) owns the consent-gated GA4 bootstrap.
	// This function is retained for future deferred third-party scripts if needed.
}

export function requestGaClientId(): Promise<string | null> {
	if (window.__dbaAnalyticsEnabled !== true) {
		return Promise.resolve(null);
	}

	if (typeof window.gtag !== "function") {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		let settled = false;
		const timeout = window.setTimeout(() => {
			if (settled) return;
			settled = true;
			resolve(null);
		}, 2500);

		try {
			window.gtag?.(
				"get",
				GA_MEASUREMENT_ID,
				"client_id",
				(clientId: unknown) => {
					if (settled) return;
					settled = true;
					window.clearTimeout(timeout);
					resolve(
						typeof clientId === "string" && clientId.length > 0
							? clientId
							: null,
					);
				},
			);
		} catch {
			if (!settled) {
				settled = true;
				window.clearTimeout(timeout);
				resolve(null);
			}
		}
	});
}
