export const DEFAULT_PUBLIC_API_BASE_URL = "https://api.designedbyanthony.com";

export function getPublicApiBaseUrl(): string {
	return (
		process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
		DEFAULT_PUBLIC_API_BASE_URL
	);
}

export function buildPublicApiUrl(path: `/${string}`): string {
	return `${getPublicApiBaseUrl()}${path}`;
}
