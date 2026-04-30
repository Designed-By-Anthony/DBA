export const DEFAULT_PUBLIC_API_BASE_URL = "https://api.designedbyanthony.com";
const LOCAL_PUBLIC_API_BASE_URL = "";

export function getPublicApiBaseUrl(): string {
	const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
		/\/$/,
		"",
	);
	if (configuredBase) return configuredBase;
	if (process.env.NODE_ENV !== "production") return LOCAL_PUBLIC_API_BASE_URL;
	return DEFAULT_PUBLIC_API_BASE_URL;
}

export function buildPublicApiUrl(path: `/${string}`): string {
	return `${getPublicApiBaseUrl()}${path}`;
}
