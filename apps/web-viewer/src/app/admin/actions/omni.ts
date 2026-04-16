"use server";

import { db } from "@/lib/firebase";
import { verifyAuth } from "./auth";

export async function searchOmni(query: string): Promise<
  { id: string; name: string; email: string; company: string }[]
> {
  const session = await verifyAuth();
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  try {
    const snapshot = await db
      .collection("prospects")
      .where("agencyId", "==", session.user.agencyId)
      .get();

    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        email: doc.data().email || "",
        company: doc.data().company || "",
      }))
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);

    return results;
  } catch (e) {
    console.error("Omnisearch Error:", e);
    return [];
  }
}

