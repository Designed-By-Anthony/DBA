"use server";

import { db } from "@/lib/firebase";
import { verifyAuth } from "./auth";
import { getProspect } from "./prospects";
import { addActivity } from "./timeline";

export async function generateContractAction(params: {
  prospectId: string;
  downPayment: number;
  completionPayment: number;
  monthlyRetainer: number;
  retainerTierName: string;
  crmTierName: string;
}): Promise<{ docUrl: string | null; error?: string }> {
  await verifyAuth();

  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { docUrl: null, error: "Prospect not found" };

    if (process.env.NEXT_PUBLIC_IS_TEST === "true") {
      await db.collection("prospects").doc(params.prospectId).update({
        contractDocUrl: "https://docs.google.com/test-sandbox-doc",
        status: "proposal",
      });
      return { docUrl: "https://docs.google.com/test-sandbox-doc" };
    }

    const { generateContract } = await import("@/lib/google-workspace");
    const result = await generateContract({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
      clientPhone: prospect.phone,
      downPayment: params.downPayment,
      completionPayment: params.completionPayment,
      monthlyRetainer: params.monthlyRetainer,
      retainerTierName: params.retainerTierName,
      crmTierName: params.crmTierName,
    });

    await db.collection("prospects").doc(params.prospectId).update({
      contractDocUrl: result.docUrl,
      status:
        prospect.status === "lead" || prospect.status === "contacted"
          ? "proposal"
          : prospect.status,
    });

    await addActivity(
      params.prospectId,
      "contract_sent",
      "Contract generated and shared",
      `MSA sent to ${prospect.email} for e-signature`,
      { docId: result.docId, docUrl: result.docUrl },
    );

    return { docUrl: result.docUrl };
  } catch (err: unknown) {
    console.error("[Contract Generation Error]", err);
    return {
      docUrl: null,
      error: err instanceof Error ? err.message : "Failed to generate contract",
    };
  }
}

export async function createClientFolderAction(
  prospectId: string,
): Promise<{ folderUrl: string | null; error?: string }> {
  try {
    const prospect = await getProspect(prospectId);
    if (!prospect) return { folderUrl: null, error: "Prospect not found" };

    const { createClientFolder } = await import("@/lib/google-workspace");
    const result = await createClientFolder({
      clientName: prospect.name,
      companyName: prospect.company || prospect.name,
      clientEmail: prospect.email,
    });

    await db.collection("prospects").doc(prospectId).update({
      driveFolderUrl: result.folderUrl,
    });

    await addActivity(
      prospectId,
      "note_added",
      "Google Drive folder created",
      `Client folder with Assets/Contracts/Deliverables subfolders. Assets folder shared with ${prospect.email}`,
      { folderId: result.folderId, folderUrl: result.folderUrl },
    );

    return { folderUrl: result.folderUrl };
  } catch (err: unknown) {
    return {
      folderUrl: null,
      error: err instanceof Error ? err.message : "Failed to create Drive folder",
    };
  }
}

