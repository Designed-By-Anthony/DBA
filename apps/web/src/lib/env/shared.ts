import type { ZodError, ZodTypeAny } from "zod";
import { z } from "zod";

/**
 * Shared helpers for the "Zod" environment guard.
 *
 * Next.js runs env through `validateEnv` at import time so the build fails
 * fast when a required key is missing for the surface being validated.
 * This prevents the
 * "White Screen of Death" — code that compiles on Vercel but crashes on
 * first request because `process.env.X` is undefined.
 *
 * We intentionally skip validation when the env is obviously inert
 * (`SKIP_ENV_VALIDATION=1`, or Next.js' `lint`/ephemeral passes). All
 * production + CI builds MUST pass validation.
 */

export const booleanFromString = z
	.string()
	.optional()
	.transform((raw) => {
		if (raw == null) return undefined;
		const v = raw.trim().toLowerCase();
		if (v === "" || v === "0" || v === "false" || v === "no" || v === "off")
			return false;
		if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
		return undefined;
	});

/**
 * A `DATABASE_URL` that, if present, must look like a valid Postgres
 * connection string. Empty string is treated as "not set" so dev
 * machines without a database don't get a build-breaking error.
 */
export const optionalPostgresUrl = z
	.string()
	.trim()
	.refine(
		(v) => v === "" || /^postgres(ql)?:\/\//i.test(v),
		"DATABASE_URL must be a postgres:// or postgresql:// connection string",
	)
	.optional();

export const requiredPostgresUrl = z
	.string()
	.trim()
	.min(1, "DATABASE_URL is required")
	.refine(
		(v) => /^postgres(ql)?:\/\//i.test(v),
		"DATABASE_URL must be a postgres:// or postgresql:// connection string",
	);

export const optionalUrl = z
	.preprocess(
		(raw) => {
			if (raw == null) return undefined;
			if (typeof raw !== "string") return raw;
			const value = raw.trim();
			if (value === "" || value === "undefined" || value === "null")
				return undefined;
			return value;
		},
		z.union([
			z.undefined(),
			z
				.string()
				.trim()
				.refine((v) => /^https?:\/\//i.test(v), "Must be an http(s) URL"),
		]),
	)
	.optional();

export const requiredUrl = z.string().trim().url("Must be an http(s) URL");

export function shouldSkipEnvValidation(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const flag = (env.SKIP_ENV_VALIDATION ?? "").toLowerCase();
	if (flag === "1" || flag === "true") return true;
	// Next.js runs a lint pass that imports config without prod secrets.
	if (env.NEXT_PHASE === "phase-lint") return true;
	return false;
}

export type EnvValidationResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: ZodError };

export function formatEnvError(appName: string, error: ZodError): string {
	const lines = error.issues.map((i) => {
		const path = i.path.length ? i.path.join(".") : "(root)";
		return `  • ${path}: ${i.message}`;
	});
	return [
		`\n\u001b[31m[${appName}] Invalid environment variables — build aborted.\u001b[0m`,
		`The "Zod" environment guard refused to build ${appName} because the following vars are missing or malformed:`,
		...lines,
		`\nSee the app's .env.example for the full list of required keys, or set SKIP_ENV_VALIDATION=1 to bypass (NOT for production).\n`,
	].join("\n");
}

export function validateEnv<S extends ZodTypeAny>(
	appName: string,
	schema: S,
	env: NodeJS.ProcessEnv = process.env,
): z.infer<S> {
	if (shouldSkipEnvValidation(env)) {
		return schema.parse(env) as z.infer<S>;
	}
	const parsed = schema.safeParse(env);
	if (parsed.success) return parsed.data as z.infer<S>;
	const message = formatEnvError(appName, parsed.error);
	throw new Error(message);
}
