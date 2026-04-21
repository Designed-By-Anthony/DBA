import assert from "node:assert/strict";
import test from "node:test";

process.env.VERCEL_ENV = "production";
process.env.VERTAFLOW_UPSTREAM_URL = "https://vertaflow-preview.vercel.app";
process.env.ADMIN_UPSTREAM_URL = "https://crm-preview.vercel.app";
process.env.ACCOUNTS_UPSTREAM_URL = "https://portal-preview.vercel.app";
process.env.LIGHTHOUSE_UPSTREAM_URL = "https://lighthouse-preview.vercel.app";

const { default: middleware } = await import("./middleware.ts");

test("rewrites vertaflow apex hosts to the VertaFlow upstream", () => {
	const request = new Request(
		"https://designedbyanthony.com/pricing?plan=pro",
		{
			headers: { host: "vertaflow.io" },
		},
	);

	const response = middleware(request);

	assert.equal(
		response.headers.get("x-middleware-rewrite"),
		"https://vertaflow-preview.vercel.app/pricing?plan=pro",
	);
});

test("rewrites www.vertaflow.io to the same VertaFlow upstream", () => {
	const request = new Request("https://designedbyanthony.com/blog", {
		headers: { host: "www.vertaflow.io" },
	});

	const response = middleware(request);

	assert.equal(
		response.headers.get("x-middleware-rewrite"),
		"https://vertaflow-preview.vercel.app/blog",
	);
});
