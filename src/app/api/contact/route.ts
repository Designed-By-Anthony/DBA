import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	buildPublicLeadPayloadFromFormData,
	type PublicLeadIngestBody,
	parsePublicLeadIngestBody,
} from "@/lib/lead-form-contract";
import { verifyMarketingLeadBotProtection } from "@/lib/marketingBotVerification";

/**
 * CORS: DBA marketing origins, local dev, and Firebase App Hosting (`*.hosted.app`)
 * preview/production URLs.
 */
const APEX_SUBDOMAIN_PATTERN =
	/^https:\/\/([a-z0-9-]+\.)*designedbyanthony\.com$/i;
const LOCAL_ORIGINS = new Set<string>([
	"http://localhost:4321",
	"http://127.0.0.1:4321",
	"http://localhost:3000", // pragma: allowlist secret
	"http://127.0.0.1:3000", // pragma: allowlist secret
	"http://localhost:3100", // pragma: allowlist secret
	"http://127.0.0.1:3100", // pragma: allowlist secret
]);

function isFirebaseHostedAppOrigin(origin: string): boolean {
	try {
		const u = new URL(origin);
		return u.protocol === "https:" && u.hostname.endsWith(".hosted.app");
	} catch {
		return false;
	}
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
	const isAllowed =
		!!origin &&
		(APEX_SUBDOMAIN_PATTERN.test(origin) ||
			LOCAL_ORIGINS.has(origin) ||
			isFirebaseHostedAppOrigin(origin));
	const allow = isAllowed && origin ? origin : "https://designedbyanthony.com";
	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		Vary: "Origin",
	};
}

function readLeadWebhookUrl(): string | undefined {
	const v = process.env.LEAD_WEBHOOK_URL?.trim();
	return v || undefined;
}

function stripInternalLeadFields(
	body: PublicLeadIngestBody,
): Record<string, unknown> {
	const { cfTurnstileResponse: _cf, recaptchaToken: _rt, _hp, ...rest } = body;
	return rest as Record<string, unknown>;
}

function getClientIp(request: Request): string | null {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip");
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
		const contentType = request.headers.get("content-type") || "";

		let parsed: PublicLeadIngestBody;

		if (contentType.includes("application/json")) {
			const raw: unknown = await request.json().catch(() => null);
			if (raw == null || typeof raw !== "object") {
				return NextResponse.json(
					{ error: "Invalid JSON body" },
					{ status: 400, headers: corsHeaders },
				);
			}
			try {
				parsed = parsePublicLeadIngestBody(raw);
			} catch (e) {
				if (e instanceof ZodError) {
					return NextResponse.json(
						{
							errors: e.issues.map((i) => ({
								message: i.message,
								path: i.path.join("."),
							})),
						},
						{ status: 400, headers: corsHeaders },
					);
				}
				throw e;
			}
		} else {
			const formData = await request.formData().catch(() => null);
			if (!formData) {
				return NextResponse.json(
					{ error: "Invalid form data" },
					{ status: 400, headers: corsHeaders },
				);
			}
			parsed = buildPublicLeadPayloadFromFormData(formData);
		}

		const bot = await verifyMarketingLeadBotProtection({
			lead: parsed,
			userAgent: request.headers.get("user-agent"),
			userIpAddress: getClientIp(request),
		});
		if (!bot.ok) {
			return NextResponse.json(
				{ errors: [{ message: bot.message }] },
				{ status: 403, headers: corsHeaders },
			);
		}

		const webhookUrl = readLeadWebhookUrl();
		if (!webhookUrl) {
			console.error(
				"[contact] LEAD_WEBHOOK_URL is not configured; rejecting lead",
			);
			return NextResponse.json(
				{
					errors: [
						{
							message:
								"Lead delivery is not configured on this deployment. Please try again later.",
						},
					],
				},
				{ status: 503, headers: corsHeaders },
			);
		}

		const outbound = stripInternalLeadFields(parsed);
		const crmRes = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(outbound),
		});

		if (!crmRes.ok) {
			const errBody = (await crmRes.json().catch(() => ({}))) as {
				error?: string;
			};
			console.error("[contact] Lead webhook failed", crmRes.status, errBody);
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

		return NextResponse.json({ ok: true }, { headers: corsHeaders });
	} catch (err: unknown) {
		console.error("Contact Form Error:", err);
		return NextResponse.json(
			{ errors: [{ message: "Server error processing request." }] },
			{ status: 500, headers: corsHeaders },
		);
	}
}
