import { google } from "googleapis";

/**
 * Appends a row to the Lighthouse Leads sheet via the Google Sheets API.
 *
 * Auth: Application Default Credentials from the App Hosting runtime service
 * account. The SA email must have Editor access to the sheet (share the sheet
 * with it manually), and the Google Sheets API must be enabled on the GCP project.
 *
 * Fire-and-forget: never throws, never blocks the user. CRM stopgap only.
 */
export async function pushLeadRow(row: {
	reportId: string;
	name: string;
	email: string;
	company: string;
	location: string;
	url: string;
	trustScore: number;
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
	conversion: number;
	rating: number | null;
	lcp: string;
	failedAuditCount: number;
	criticalIssue: string;
}): Promise<void> {
	const sheetId = process.env.SHEETS_ID;
	if (!sheetId) {
		console.warn("SHEETS_ID not set — skipping Sheets sync");
		return;
	}

	try {
		const auth = new google.auth.GoogleAuth({
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});
		const sheets = google.sheets({ version: "v4", auth });

		const reportLink = `https://designedbyanthony.com/report/${row.reportId}`;

		await sheets.spreadsheets.values.append({
			spreadsheetId: sheetId,
			range: "A:Q", // Expand range for new cols
			valueInputOption: "USER_ENTERED",
			insertDataOption: "INSERT_ROWS",
			requestBody: {
				values: [
					[
						new Date().toISOString(),
						row.reportId,
						row.name,
						row.email,
						row.company,
						row.location,
						row.url,
						row.trustScore,
						row.performance,
						row.conversion,
						row.rating,
						row.lcp,
						row.criticalIssue,
						reportLink,
					],
				],
			},
		});
	} catch (err) {
		console.error(
			"Sheets sync failed:",
			err instanceof Error ? err.message : err,
		);
	}
}

/* ═══════════════════════════════════════════════════════════════════
 *  createProjectSheet()
 *
 *  Creates a standalone Google Sheet named with the project code.
 *  Pre-populated with a professional project profile layout.
 *
 *  Returns the URL of the new sheet, or null if creation fails.
 *  Requires: Google Sheets API + Google Drive API enabled on the project.
 *  The service account must have Editor access to the target Drive folder
 *  (or sheets will be created in the SA's own drive root).
 * ═══════════════════════════════════════════════════════════════════ */

export interface ProjectSheetData {
	projectCode: string; // e.g. "DBA-PlumbK3X2" or "CONTACT-1712678400000"
	source: "audit" | "contact";
	name: string;
	email: string;
	company: string;
	url: string;
	location?: string;
	phone?: string;
	message?: string;
	// Audit-specific fields (optional)
	trustScore?: number;
	performance?: number;
	accessibility?: number;
	bestPractices?: number;
	seo?: number;
	conversion?: number;
	rating?: number | null;
	reviewCount?: number;
	lcp?: string;
	fcp?: string;
	tbt?: string;
	cls?: string;
	failedAuditCount?: number;
	criticalIssue?: string;
	executiveSummary?: string;
	strengths?: string[];
	weaknesses?: string[];
	prioritizedActions?: Array<
		| string
		| { priority?: number; action: string; impact?: string; effort?: string }
	>;
}

export async function createProjectSheet(
	data: ProjectSheetData,
): Promise<string | null> {
	try {
		const auth = new google.auth.GoogleAuth({
			scopes: [
				"https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/drive.file",
			],
		});
		const sheets = google.sheets({ version: "v4", auth });
		const drive = google.drive({ version: "v3", auth });

		const now = new Date().toLocaleString("en-US", {
			timeZone: "America/New_York",
		});
		const isAudit = data.source === "audit";
		const sheetTitle = `${data.projectCode} — ${data.company || "Lead"}`;

		// ── Create the spreadsheet ──
		const createRes = await sheets.spreadsheets.create({
			requestBody: {
				properties: {
					title: sheetTitle,
				},
				sheets: [
					{
						properties: {
							title: "Project Profile",
							gridProperties: { frozenRowCount: 1, columnCount: 4 },
						},
					},
					{
						properties: {
							title: "Notes & Follow-up",
							gridProperties: { columnCount: 3 },
						},
					},
				],
			},
		});

		const spreadsheetId = createRes.data.spreadsheetId!;
		const spreadsheetUrl = createRes.data.spreadsheetUrl!;

		// ── Build the Project Profile rows ──
		const profileRows: string[][] = [
			["FIELD", "VALUE", "CATEGORY", "NOTES"],
			["Project Code", data.projectCode, "Identity", ""],
			["Source", isAudit ? "Free SEO Audit" : "Contact Form", "Identity", ""],
			["Created", now, "Identity", ""],
			["", "", "", ""],
			["CONTACT INFO", "", "", ""],
			["Name", data.name, "Contact", ""],
			["Email", data.email, "Contact", ""],
			["Company", data.company, "Contact", ""],
			["Website", data.url, "Contact", ""],
			["Location", data.location || "", "Contact", ""],
			["Phone", data.phone || "", "Contact", ""],
		];

		if (data.message) {
			profileRows.push(["Message", data.message, "Contact", ""]);
		}

		if (isAudit) {
			const reportLink = `https://designedbyanthony.com/report/${data.projectCode}`;
			profileRows.push(
				["", "", "", ""],
				["AUDIT SCORES", "", "", ""],
				[
					"Local Trust Score",
					String(data.trustScore ?? "N/A"),
					"Scores",
					"/100",
				],
				["Performance", String(data.performance ?? "N/A"), "Scores", "/100"],
				[
					"Accessibility",
					String(data.accessibility ?? "N/A"),
					"Scores",
					"/100",
				],
				[
					"Best Practices",
					String(data.bestPractices ?? "N/A"),
					"Scores",
					"/100",
				],
				["SEO", String(data.seo ?? "N/A"), "Scores", "/100"],
				[
					"Conversion Score",
					String(data.conversion ?? "N/A"),
					"Scores",
					"/100",
				],
				[
					"Google Rating",
					data.rating != null ? `${data.rating}/5.0` : "Not found",
					"Reputation",
					`${data.reviewCount ?? 0} reviews`,
				],
				["", "", "", ""],
				["CORE WEB VITALS", "", "", ""],
				["FCP", data.fcp || "N/A", "Metrics", ""],
				["LCP", data.lcp || "N/A", "Metrics", ""],
				["TBT", data.tbt || "N/A", "Metrics", ""],
				["CLS", data.cls || "N/A", "Metrics", ""],
				[
					"Failed Audits",
					String(data.failedAuditCount ?? 0),
					"Diagnostics",
					"",
				],
				["Critical Issue", data.criticalIssue || "None", "Diagnostics", ""],
				["", "", "", ""],
				["AI ANALYSIS", "", "", ""],
				["Executive Summary", data.executiveSummary || "", "AI", ""],
				["Report Link", reportLink, "Links", ""],
			);

			if (data.strengths && data.strengths.length > 0) {
				profileRows.push(["", "", "", ""]);
				profileRows.push(["STRENGTHS", "", "", ""]);
				data.strengths.forEach((s, i) =>
					profileRows.push([`${i + 1}`, s, "Strengths", ""]),
				);
			}

			if (data.weaknesses && data.weaknesses.length > 0) {
				profileRows.push(["", "", "", ""]);
				profileRows.push(["WEAKNESSES", "", "", ""]);
				data.weaknesses.forEach((w, i) =>
					profileRows.push([`${i + 1}`, w, "Weaknesses", ""]),
				);
			}

			if (data.prioritizedActions && data.prioritizedActions.length > 0) {
				profileRows.push(["", "", "", ""]);
				profileRows.push(["ACTION ITEMS", "", "", ""]);
				data.prioritizedActions.forEach((a, i) => {
					const label = typeof a === "string" ? a : a.action;
					profileRows.push([
						`${i + 1}`,
						label,
						"Actions",
						typeof a === "object"
							? `Impact: ${a.impact || "N/A"} | Effort: ${a.effort || "N/A"}`
							: "",
					]);
				});
			}
		}

		// ── Build the Notes sheet ──
		const notesRows: string[][] = [
			["DATE", "NOTE", "STATUS"],
			[
				now,
				`${isAudit ? "Audit" : "Contact"} form submitted. Awaiting follow-up.`,
				"New Lead",
			],
		];

		// ── Write data to both sheets ──
		await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId,
			requestBody: {
				valueInputOption: "USER_ENTERED",
				data: [
					{ range: "Project Profile!A1", values: profileRows },
					{ range: "Notes & Follow-up!A1", values: notesRows },
				],
			},
		});

		// ── Move to shared Drive folder if configured ──
		const folderId = process.env.DRIVE_PROJECTS_FOLDER_ID;
		if (folderId) {
			try {
				await drive.files.update({
					fileId: spreadsheetId,
					addParents: folderId,
					fields: "id, parents",
				});
			} catch (moveErr) {
				console.warn(
					"Could not move sheet to projects folder:",
					moveErr instanceof Error ? moveErr.message : moveErr,
				);
			}
		}

		if (process.env.NODE_ENV === "development") {
			console.info(`Project sheet created: ${sheetTitle} → ${spreadsheetUrl}`);
		}
		return spreadsheetUrl;
	} catch (err) {
		console.error(
			"Project sheet creation failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}
