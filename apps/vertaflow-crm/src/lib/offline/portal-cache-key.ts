import { createHash } from "node:crypto";

export function createPortalOfflineCacheKey(
	tenantId: string,
	prospectId: string,
): string {
	return createHash("sha256")
		.update(`${tenantId}:${prospectId}`)
		.digest("hex")
		.slice(0, 24);
}
