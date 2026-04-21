import { safeParseVerticalLeadMetadata, type VerticalId } from "@dba/ui";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fireAutomationEvent } from "@/lib/automation-runner";
import { readBoundedJson } from "@/lib/body-limit";
import { embedLeadCorsHeaders } from "@/lib/embed-lead-cors";
import { verifyEmbedTenantSignature } from "@/lib/embed-widget-signature";
import {
	checkLeadRateLimit,
	isLikelyBotSubmission,
	validatePublicLead,
} from "@/lib/lead-intake/spam-guard";
import { insertSqlLead } from "@/lib/lead-intake/sql";
import { resolveLeadAgencyId } from "@/lib/lead-webhook-agency";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { verifyTurnstileToken } from "@/lib/turnstile";

const MAX_BYTES = 16 * 1024;

const bodySchema = z.object({
	tenantId: z.string().trim().min(1).max(120),
	sig: z.string().trim().min(16).max(512),
	name: z.string().trim().min(1).max(200),
	email: z.string().trim().email().max(254),
	phone: z.string().trim().max(40).optional(),
	company: z.string().trim().max(200).optional(),
	website: z.string().trim().max(500).optional(),
	message: z.string().trim().max(8000).optional(),
	source: z.string().trim().max(80).optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	_hp: z.string().optional(),
	cfTurnstileResponse: z.string().optional(),
	pageUrl: z.string().url().max(2000).optional(),
	referrerUrl: z.string().url().max(2000).optional(),
});

function resolveClientIp(request: NextRequest): string {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	return (
		request.headers.get("x-real-ip") ||
		request.headers.get("cf-connecting-ip") ||
		"unknown"
	);
}

export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 204,
		headers: embedLeadCorsHeaders(request),
	});
}

export async function POST(request: NextRequest) {
	const cors = embedLeadCorsHeaders(request);

	if (process.env.PUBLIC_LEAD_INGEST_DISABLED === "true") {
		return NextResponse.json(
			{ error: "Not found" },
			{ status: 404, headers: cors },
		);
	}

	const secret = process.env.LEAD_EMBED_WIDGET_SECRET?.trim();
	if (!secret) {
		return NextResponse.json(
			{ error: "Embed widget is not configured." },
			{ status: 503, headers: cors },
		);
	}

	const parsed = await readBoundedJson<unknown>(request, MAX_BYTES);
	if (!parsed.ok) {
		const status = parsed.reason === "too_large" ? 413 : 400;
		return NextResponse.json(
			{ error: "Invalid request" },
			{ status, headers: cors },
		);
	}

	let body: z.infer<typeof bodySchema>;
	try {
		body = bodySchema.parse(parsed.value);
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: err.issues[0]?.message ?? "Invalid request",
					issues: err.issues,
				},
				{ status: 400, headers: cors },
			);
		}
		throw err;
	}

	if (body._hp != null && String(body._hp).trim() !== "") {
		return NextResponse.json({ success: true }, { headers: cors });
	}

	if (!verifyEmbedTenantSignature(body.tenantId, body.sig, secret)) {
		return NextResponse.json(
			{ error: "Invalid signature." },
			{ status: 403, headers: cors },
		);
	}

	const clientIp = resolveClientIp(request);
	const rateLimit = checkLeadRateLimit(`embed:${clientIp}`);
	if (!rateLimit.allowed) {
		return NextResponse.json(
			{ error: "Too many submissions. Please wait and try again." },
			{
				status: 429,
				headers: {
					...cors,
					"Retry-After": String(rateLimit.retryAfterSeconds),
				},
			},
		);
	}

	const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
	if (turnstileSecret) {
		const token = body.cfTurnstileResponse?.trim();
		if (!token) {
			return NextResponse.json(
				{ error: "Bot verification required." },
				{ status: 403, headers: cors },
			);
		}
		const tv = await verifyTurnstileToken(token, clientIp);
		if (!tv.success) {
			return NextResponse.json(
				{ error: "Bot verification failed. Please try again." },
				{ status: 403, headers: cors },
			);
		}
	}

	const validationIssue = validatePublicLead({
		name: body.name,
		email: body.email,
		phone: body.phone,
		company: body.company,
		website: body.website,
		message: body.message,
	});
	if (validationIssue) {
		return NextResponse.json(
			{ error: validationIssue.message },
			{ status: 400, headers: cors },
		);
	}

	if (
		isLikelyBotSubmission({
			name: body.name,
			email: body.email,
			phone: body.phone,
			company: body.company,
			website: body.website,
			message: body.message,
		})
	) {
		return NextResponse.json({ success: true }, { headers: cors });
	}

	const agencyId = await resolveLeadAgencyId(body.tenantId);
	if (!agencyId) {
		return NextResponse.json(
			{ error: "Unable to resolve tenant." },
			{ status: 400, headers: cors },
		);
	}

	let vertical: VerticalId | undefined;
	try {
		const tenant = await getTenantByOrgId(agencyId);
		vertical = (tenant?.verticalType as VerticalId) || undefined;
	} catch {
		/* non-fatal */
	}

	const meta: Record<string, unknown> = {
		...(body.metadata && typeof body.metadata === "object"
			? body.metadata
			: {}),
		embed: {
			source: "dba_embed_widget",
			pageUrl: body.pageUrl ?? null,
			referrerUrl: body.referrerUrl ?? null,
		},
	};

	let cleanMetadata = meta;
	if (vertical) {
		const mres = safeParseVerticalLeadMetadata(vertical, meta);
		if (mres.success) {
			cleanMetadata = mres.data as Record<string, unknown>;
		}
	}

	let sqlResult: { prospectId: string; isNew: boolean } | null = null;
	try {
		sqlResult = await insertSqlLead({
			agencyId,
			name: body.name,
			email: body.email,
			phone: body.phone,
			company: body.company,
			website: body.website,
			source: body.source?.trim() || "embed_widget",
			message: body.message,
			metadata: cleanMetadata,
		});
	} catch {
		return NextResponse.json(
			{ error: "Service temporarily unavailable." },
			{ status: 503, headers: cors },
		);
	}

	if (!sqlResult) {
		return NextResponse.json(
			{ error: "Service temporarily unavailable." },
			{ status: 503, headers: cors },
		);
	}

	if (sqlResult.isNew) {
		await fireAutomationEvent({
			trigger: "lead_created",
			tenantId: agencyId,
			prospectId: sqlResult.prospectId,
			vertical,
			data: {
				lead: {
					name: body.name,
					email: body.email,
					phone: body.phone,
					source: body.source ?? "embed_widget",
					metadata: cleanMetadata,
				},
			},
		});
	}

	return NextResponse.json(
		{
			success: true,
			prospectId: sqlResult.prospectId,
			isNew: sqlResult.isNew,
			agencyId,
		},
		{ headers: cors },
	);
}
