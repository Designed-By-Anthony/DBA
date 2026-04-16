import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, portalSessions } from "@dba/database";
import type { NextRequest } from "next/server";

export type PortalSession = {
  tenantId: string;
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
};

function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPortalToken(value: string): string {
  return hashToken(value);
}

/**
 * Validate current portal session from cookie and return scoped tenant identity.
 */
export async function getPortalSessionFromRequest(request: NextRequest): Promise<PortalSession | null> {
  const sessionToken = request.cookies.get("portal_session")?.value;
  if (!sessionToken) return null;

  const database = getDb();
  if (!database) return null;

  const nowIso = new Date().toISOString();
  const tokenHash = hashToken(sessionToken);

  const rows = await database
    .select()
    .from(portalSessions)
    .where(
      and(
        eq(portalSessions.sessionTokenHash, tokenHash),
        gt(portalSessions.expiresAt, nowIso),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    tenantId: row.tenantId,
    prospectId: row.prospectId,
    prospectEmail: row.prospectEmail,
    prospectName: row.prospectName,
  };
}
