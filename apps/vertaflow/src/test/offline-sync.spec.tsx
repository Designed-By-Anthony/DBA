import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDb, resetLocalTables } from "../lib/db";
import { GlobalSyncProvider } from "../providers/GlobalSyncProvider";

describe("offline-first synchronization", () => {
	const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(
		Navigator.prototype,
		"onLine",
	);
	const fetchMock =
		vi.fn<
			(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
		>();

	beforeEach(async () => {
		await resetLocalTables();
		fetchMock.mockReset();
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					syncedLocalIds: ["11111111-1111-4111-8111-111111111111"],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		Object.defineProperty(window.navigator, "onLine", {
			configurable: true,
			get: () => false,
		});
	});

	afterEach(async () => {
		cleanup();
		await resetLocalTables();
		vi.unstubAllGlobals();

		if (originalNavigatorOnLine) {
			Object.defineProperty(
				window.navigator,
				"onLine",
				originalNavigatorOnLine,
			);
		}
	});

	it("queues offline lead and syncs when connectivity returns", async () => {
		await localDb.leads.put({
			local_id: "11111111-1111-4111-8111-111111111111",
			tenant_id: "org_demo",
			name: "Backwoods Prospect",
			email: "prospect@example.com",
			company: "Backwoods Co",
			sync_status: "pending",
			updated_at: new Date("2026-04-20T18:00:00.000Z").toISOString(),
			created_at: new Date("2026-04-20T18:00:00.000Z").toISOString(),
		});

		render(
			<GlobalSyncProvider>
				<div>sync test</div>
			</GlobalSyncProvider>,
		);

		expect(fetchMock).not.toHaveBeenCalled();

		Object.defineProperty(window.navigator, "onLine", {
			configurable: true,
			get: () => true,
		});

		await act(async () => {
			window.dispatchEvent(new Event("online"));
		});
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		const [calledUrl, calledInit] = fetchMock.mock.calls[0]!;
		expect(calledUrl).toBe("/api/sync");
		expect(calledInit?.method).toBe("POST");
		const headerValue =
			calledInit?.headers instanceof Headers
				? calledInit.headers.get("Content-Type")
				: (calledInit?.headers as Record<string, string> | undefined)?.[
						"Content-Type"
					];
		expect(String(headerValue)).toContain("application/json");

		const postedBody = JSON.parse(String(calledInit?.body ?? "{}")) as {
			records?: Array<{ local_id?: string; sync_status?: string }>;
		};
		expect(postedBody.records?.[0]?.local_id).toBe(
			"11111111-1111-4111-8111-111111111111",
		);
		expect(postedBody.records?.[0]?.sync_status).toBe("pending");

		const pendingLead = await localDb.leads.get(
			"11111111-1111-4111-8111-111111111111",
		);
		expect(pendingLead?.sync_status).toBe("synced");
	});
});
