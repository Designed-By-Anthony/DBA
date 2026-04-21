const WEB_VIEWER_ENV_ALIASES: Record<string, readonly string[]> = {
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: [
		"NEXT_PUBLIC_admin_CLERK_PUBLISHABLE_KEY",
		"NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY",
		"admin_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
	],
	CLERK_SECRET_KEY: ["admin_CLERK_SECRET_KEY", "ADMIN_CLERK_SECRET_KEY"],
};

function copyFirstPresentEnv(
	env: NodeJS.ProcessEnv,
	target: string,
	sources: readonly string[],
) {
	if (env[target]?.trim()) return;

	const sourceValue = sources
		.map((source) => env[source]?.trim())
		.find((value): value is string => Boolean(value));

	if (sourceValue) {
		env[target] = sourceValue;
	}
}

export function hydrateWebViewerEnvAliases(
	env: NodeJS.ProcessEnv = process.env,
) {
	for (const [target, sources] of Object.entries(WEB_VIEWER_ENV_ALIASES)) {
		copyFirstPresentEnv(env, target, sources);
	}
}

hydrateWebViewerEnvAliases();
