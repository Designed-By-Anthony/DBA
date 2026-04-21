"use server";

/**
 * Quote acceptance + Stripe checkout.
 * TODO: Quotes table not yet in Neon schema — this is a placeholder
 * that returns a "not implemented" error until the quotes table is migrated.
 */
export async function acceptQuoteAndCheckoutAction(_input: {
	quoteId: string;
	prospectId: string;
	packageId: string;
	signatureDataUrl: string;
}): Promise<{ url: string | null; error?: string }> {
	void _input;
	return {
		url: null,
		error:
			"Quote acceptance is temporarily unavailable during the database migration. Please contact support.",
	};
}
