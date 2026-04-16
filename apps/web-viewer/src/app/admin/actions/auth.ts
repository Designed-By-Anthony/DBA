"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { isAdminAuthDevBypassEnabled } from "@/lib/admin-dev-auth";

export type DevSession = {
  user: {
    id: string;
    email: string;
    agencyId: string;
    role: "owner" | "admin" | "member";
  };
};

export async function verifyAuth(): Promise<DevSession> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    if (isAdminAuthDevBypassEnabled()) {
      return {
        user: {
          id: "dev",
          email: "dev@local",
          agencyId: "dev-agency",
          role: "owner",
        },
      };
    }
    throw new Error("Unauthorized: No active session or organization");
  }

  let role: "owner" | "admin" | "member" = "member";
  if (orgRole === "org:admin") role = "owner";
  else if (orgRole === "org:member") role = "member";

  let email = "";
  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress || "";
  } catch {
    // non-critical
  }

  Sentry.setUser({ id: userId, email, segment: orgId });
  Sentry.setTag("orgId", orgId);
  Sentry.setTag("orgRole", role);

  return {
    user: { id: userId, email, agencyId: orgId, role },
  };
}
