/**
 * Currency Utility
 *
 * In standard financial integrations (like Stripe), money is handled in integer cents.
 * This prevents floating point errors such as 0.1 + 0.2 = 0.30000000000000004.
 */

// Converts $199.99 (number or string) to 19999
export function dollarsToCents(dollars: number | string): number {
	if (!dollars) return 0;
	const num = typeof dollars === "string" ? parseFloat(dollars) : dollars;
	if (isNaN(num)) return 0;
	return Math.round(num * 100);
}

// Converts 19999 to 199.99 (number)
export function centsToDollars(cents: number | string): number {
	if (!cents) return 0;
	const num = typeof cents === "string" ? parseInt(cents, 10) : cents;
	if (isNaN(num)) return 0;
	return Number((num / 100).toFixed(2));
}

// Formats 19999 to "$199.99" String
export function formatCents(cents: number | string): string {
	if (cents === null || cents === undefined) return "$0.00";
	const num = typeof cents === "string" ? parseInt(cents, 10) : cents;
	if (isNaN(num)) return "$0.00";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(num / 100);
}
