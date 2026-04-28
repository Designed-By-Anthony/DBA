import { verifyTurnstileToken } from "@lh/lib/turnstile";
import { NextResponse } from "next/server";
import { buildPublicLeadPayloadFromFormFields } from "@/lib/lead-form-contract";
import { postLeadIngest, resolveContactLeadIngestUrl } from "@/lib/leadWebhook";
import { buildMarketingLeadApiCorsHeaders } from "@/lib/marketingBrowserOrigins";

/**
 * CORS: production apex, Firebase App Hosting / Netlify previews, and local dev
 * may call this endpoint from a browser (never `*`).
 */
function buildCorsHeaders(origin: string | null): Record<string, string> {
	return buildMarketingLeadApiCorsHeaders(origin);
}

export async function OPTIONS(request: Request) {
	return NextResponse.json(
		{},
		{ headers: buildCorsHeaders(request.headers.get("origin")) },
	);
}

export async function POST(request: Request) {
	const corsHeaders = buildCorsHeaders(request.headers.get("origin"));
	try {
		const formData = await request.formData().catch(() => null);

		if (!formData) {
			return NextResponse.json(
				{ error: "Invalid form data" },
				{ status: 400, headers: corsHeaders },
			);
		}

		const firstName = formData.get("first_name")?.toString() || "";
		const email = formData.get("email")?.toString() || "";

		if (!firstName || !email) {
			return NextResponse.json(
				{ errors: [{ message: "First name and email are required." }] },
				{ status: 400, headers: corsHeaders },
			);
		}

		const turnstileToken =
			formData.get("cf-turnstile-response")?.toString() || "";
		const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
		if (turnstileToken && turnstileSecret) {
			const verifyRes = await verifyTurnstileToken(turnstileToken);
			if (!verifyRes.success) {
				return NextResponse.json(
					{
						errors: [
							{
								message:
									"Bot verification failed. Please refresh and try again.",
							},
						],
					},
					{ status: 403, headers: corsHeaders },
				);
			}
		} else if (!turnstileToken) {
			return NextResponse.json(
				{ errors: [{ message: "Security verification is required." }] },
				{ status: 403, headers: corsHeaders },
			);
		}

		const payload = buildPublicLeadPayloadFromFormFields({
			first_name: formData.get("first_name")?.toString() || "",
			email: formData.get("email")?.toString() || "",
			website: formData.get("website")?.toString() || "",
			biggest_issue: formData.get("biggest_issue")?.toString() || "",
			phone: formData.get("phone")?.toString() || "",
			cta_source: formData.get("cta_source")?.toString() || "",
			page_context: formData.get("page_context")?.toString() || "",
			offer_type: formData.get("offer_type")?.toString() || "",
			lead_source: formData.get("lead_source")?.toString() || "",
			page_url: formData.get("page_url")?.toString() || "",
			referrer_url: formData.get("referrer_url")?.toString() || "",
			page_title: formData.get("page_title")?.toString() || "",
			source_page: formData.get("source_page")?.toString() || "",
			ga_client_id: formData.get("ga_client_id")?.toString() || "",
			_hp: formData.get("_hp")?.toString() || "",
			"cf-turnstile-response": turnstileToken,
		});

		const crmUrl = resolveContactLeadIngestUrl();
		if (!crmUrl) {
			console.error(
				"[contact] LEAD_WEBHOOK_URL (or legacy AGENCY_OS_LEAD_INGEST_URL) is not configured; rejecting lead",
			);
			return NextResponse.json(
				{
					errors: [
						{
							message:
								"Lead ingest is not configured on this deployment. Please try again later.",
						},
					],
				},
				{ status: 503, headers: corsHeaders },
			);
		}

		const { cfTurnstileResponse: _turnstile, ...outboundPayload } = payload;
		const crmRes = await postLeadIngest(crmUrl, outboundPayload);

		if (!crmRes.ok) {
			const errBody = (await crmRes.json().catch(() => ({}))) as {
				error?: string;
			};
			console.error("[contact] CRM lead ingest failed", crmRes.status, errBody);
			return NextResponse.json(
				{
					errors: [
						{
							message:
								errBody.error ||
								"Could not save your request. Please try again later.",
						},
					],
				},
				{ status: 502, headers: corsHeaders },
			);
		}

		const deprecationHeaders = {
			...corsHeaders,
			Deprecation: "true",
			Sunset: "Sat, 01 Nov 2026 00:00:00 GMT",
			Link: '</docs>; rel="sunset" ',
		};

		return NextResponse.json(
			{
				ok: true,
				deprecated: true,
				message:
					"This endpoint is deprecated for public marketing forms. Use Agency OS POST /api/lead directly.",
			},
			{ headers: deprecationHeaders },
		);
	} catch (err: unknown) {
		console.error("Contact Form Error:", err);
		return NextResponse.json(
			{ errors: [{ message: "Server error processing request." }] },
			{ status: 500, headers: corsHeaders },
		);
	}
}
