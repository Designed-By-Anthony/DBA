import { Elysia, t } from "elysia";
import { leads as leadsTable } from "@dba/shared/db/schema";
import { createD1Client } from "@dba/shared/db/client";
import { desc, eq } from "drizzle-orm";
interface CfEnv {
  // D1Database is a Cloudflare Workers global; use unknown for TS compat outside worker context
  DB?: unknown;
}

export const leadsRoute = new Elysia({ prefix: "/leads" })
  .get("", async ({ set, store }) => {
    set.headers["Cache-Control"] = "no-store";

    try {
      const d1 = (store as { env?: CfEnv }).env?.DB;

      if (!d1) {
        return {
          error: "Database not available",
          leads: [],
        };
      }

      const db = createD1Client(d1);
      const allLeads = await db
        .select()
        .from(leadsTable)
        .orderBy(desc(leadsTable.created_at));

      return {
        leads: allLeads,
      };
    } catch (error) {
      console.error("Error fetching leads:", error);
      return {
        error: "Failed to fetch leads",
        leads: [],
      };
    }
  })
  .delete(
    "/:id",
    async ({ params, set, store }) => {
      set.headers["Cache-Control"] = "no-store";

      try {
        const d1 = (store as { env?: CfEnv }).env?.DB;

        if (!d1) {
          return {
            error: "Database not available",
            success: false,
          };
        }

        const db = createD1Client(d1);
        const result = await db
          .delete(leadsTable)
          .where(eq(leadsTable.id, params.id))
          .returning();

        return {
          success: result.length > 0,
          deletedId: params.id,
        };
      } catch (error) {
        console.error("Error deleting lead:", error);
        return {
          error: "Failed to delete lead",
          success: false,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );