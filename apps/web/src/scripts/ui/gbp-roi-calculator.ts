function formatUsd(value: number): string {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});
}

/** Display-only; keep fractional daily customers visible for small % lifts. */
function formatCustomersPerDay(n: number): string {
	return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/**
 * Google Business Profile ROI calculator (illustrative model; same math as partner embed).
 */
export function initGbpRoiCalculator(): void {
	document
		.querySelectorAll<HTMLElement>("[data-gbp-roi-calculator]")
		.forEach((root) => {
			if (root.dataset.gbpRoiBound === "true") return;
			root.dataset.gbpRoiBound = "true";

			const form = root.querySelector("form");
			const resultEl = root.querySelector<HTMLElement>('[data-role="result"]');
			if (!form || !resultEl) return;

			form.addEventListener("submit", (event: Event) => {
				event.preventDefault();

				const fd = new FormData(form);
				const customers = Number.parseFloat(String(fd.get("customers") ?? ""));
				const value = Number.parseFloat(String(fd.get("value") ?? ""));
				const increase = Number.parseFloat(String(fd.get("increase") ?? ""));
				const cost = Number.parseFloat(String(fd.get("cost") ?? ""));

				if (
					[customers, value, increase, cost].some((n) => Number.isNaN(n)) ||
					cost <= 0 ||
					customers < 0 ||
					value < 0 ||
					increase < 0
				) {
					resultEl.removeAttribute("hidden");
					resultEl.innerHTML =
						"<p>Enter valid numbers in every field. Monthly cost must be greater than zero.</p>";
					return;
				}

				const additionalCustomersPerDay = customers * (increase / 100);
				const additionalRevenue = Math.round(
					additionalCustomersPerDay * value * 30,
				);
				const roi = Math.round(((additionalRevenue - cost) / cost) * 100);
				const customersDayDisplay = formatCustomersPerDay(
					additionalCustomersPerDay,
				);

				resultEl.removeAttribute("hidden");
				resultEl.innerHTML = [
					"<p>",
					`At these inputs, modeled ROI is <strong>${roi}%</strong> on the monthly investment, `,
					`with about <strong>${formatUsd(additionalRevenue)}</strong> in additional monthly revenue before costs.`,
					"</p>",
					'<p style="margin-top:0.75rem;color:var(--text-gray);font-size:0.88rem;">',
					`Additional customers per day (modeled): ${customersDayDisplay} · `,
					`Monthly revenue (modeled): ${customersDayDisplay} × ${formatUsd(value)} × 30 days ≈ ${formatUsd(additionalRevenue)}`,
					"</p>",
				].join("");
			});
		});
}
