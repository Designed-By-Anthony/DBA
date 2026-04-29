import { fetchWithTimeout } from "./http";

export interface PlacesResult {
	found: boolean;
	rating: number | null;
	userRatingCount: number;
	businessStatus: string | null;
	primaryType: string | null;
}

export interface Competitor {
	name: string;
	rating: number | null;
	reviewCount: number;
	address: string;
}

interface PlacesApiDisplayName {
	text?: string;
}

interface PlacesApiPlace {
	rating?: number;
	userRatingCount?: number;
	businessStatus?: string;
	primaryType?: string;
	displayName?: PlacesApiDisplayName;
	formattedAddress?: string;
}

interface PlacesApiResponse {
	places?: PlacesApiPlace[];
}

/**
 * Queries Google Places API (New) to find reputation data for a business.
 */
export async function scanPlaces(
	companyName: string,
	location: string,
	timeoutMs: number = 8000,
): Promise<PlacesResult> {
	const result: PlacesResult = {
		found: false,
		rating: null,
		userRatingCount: 0,
		businessStatus: null,
		primaryType: null,
	};

	const apiKey = process.env.GOOGLE_PLACES_API_KEY;

	if (!apiKey || !companyName) {
		return result;
	}

	const query = location ? `${companyName} in ${location}` : companyName;

	try {
		const url = "https://places.googleapis.com/v1/places:searchText";

		const res = await fetchWithTimeout(
			url,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": apiKey,
					"X-Goog-FieldMask":
						"places.rating,places.userRatingCount,places.businessStatus,places.primaryType",
				},
				body: JSON.stringify({
					textQuery: query,
				}),
			},
			timeoutMs,
		);

		if (!res.ok) {
			console.warn(`Places API failed with status: ${res.status}`);
			return result;
		}

		const data = (await res.json()) as PlacesApiResponse;
		if (data.places && data.places.length > 0) {
			const place = data.places[0];
			result.found = true;
			result.rating = place.rating ?? null;
			result.userRatingCount = place.userRatingCount ?? 0;
			result.businessStatus = place.businessStatus ?? null;
			result.primaryType = place.primaryType ?? null;
		}

		return result;
	} catch (err) {
		console.warn(
			"Places query failed:",
			err instanceof Error ? err.message : err,
		);
		return result;
	}
}

/**
 * Business types that warrant a meaningful competitor comparison.
 * If the Places API returns a type not on this list (e.g., 'establishment'),
 * we skip the competitor scan to avoid showing irrelevant businesses.
 */
const COMPETITOR_TYPE_WHITELIST = new Set([
	"plumber",
	"electrician",
	"hvac_contractor",
	"roofing_contractor",
	"general_contractor",
	"painter",
	"landscaper",
	"moving_company",
	"locksmith",
	"pest_control_service",
	"cleaning_service",
	"handyman",
	"auto_repair",
	"auto_body_shop",
	"car_dealer",
	"car_wash",
	"restaurant",
	"cafe",
	"bakery",
	"bar",
	"pizza_restaurant",
	"meal_delivery",
	"meal_takeaway",
	"dentist",
	"doctor",
	"veterinary_care",
	"physiotherapist",
	"hair_salon",
	"beauty_salon",
	"spa",
	"gym",
	"yoga_studio",
	"real_estate_agency",
	"insurance_agency",
	"accounting",
	"lawyer",
	"law_firm",
	"notary_public",
	"florist",
	"pet_store",
	"jewelry_store",
	"furniture_store",
	"web_designer",
	"marketing_agency",
	"graphic_designer",
	"photographer",
	"videographer",
	"travel_agency",
	"hotel",
	"lodging",
]);

/**
 * Finds the top N competitors near a business using Google Places Text Search.
 * Uses the primary business type from the initial Places lookup + the location.
 */
export async function scanCompetitors(
	companyName: string,
	location: string,
	primaryType: string | null,
	maxResults: number = 3,
	timeoutMs: number = 8000,
): Promise<Competitor[]> {
	const apiKey = process.env.GOOGLE_PLACES_API_KEY;

	if (!apiKey || !location) return [];

	// Skip competitor scan if the business type is unknown or too generic
	if (
		!primaryType ||
		primaryType === "establishment" ||
		!COMPETITOR_TYPE_WHITELIST.has(primaryType)
	) {
		console.info(
			`Skipping competitor scan: primaryType "${primaryType}" is not in whitelist.`,
		);
		return [];
	}

	// Build a search query like "plumber in Syracuse, NY"
	const typeLabel = primaryType.replace(/_/g, " ");
	const query = `${typeLabel} in ${location}`;

	try {
		const url = "https://places.googleapis.com/v1/places:searchText";

		const res = await fetchWithTimeout(
			url,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": apiKey,
					"X-Goog-FieldMask":
						"places.displayName,places.rating,places.userRatingCount,places.formattedAddress",
				},
				body: JSON.stringify({
					textQuery: query,
					maxResultCount: maxResults + 3, // fetch extras to filter out the audited business
				}),
			},
			timeoutMs,
		);

		if (!res.ok) {
			console.warn(`Competitor search failed with status: ${res.status}`);
			return [];
		}

		const data = (await res.json()) as PlacesApiResponse;
		if (!data.places || data.places.length === 0) return [];

		const normalizedCompany = companyName.toLowerCase().trim();
		const competitors: Competitor[] = [];

		for (const place of data.places) {
			const placeName = place.displayName?.text || "";
			// Skip the audited business itself
			if (
				placeName.toLowerCase().includes(normalizedCompany) ||
				normalizedCompany.includes(placeName.toLowerCase())
			) {
				continue;
			}

			competitors.push({
				name: placeName,
				rating: place.rating ?? null,
				reviewCount: place.userRatingCount ?? 0,
				address: place.formattedAddress ?? "",
			});

			if (competitors.length >= maxResults) break;
		}

		return competitors;
	} catch (err) {
		console.warn(
			"Competitor scan failed:",
			err instanceof Error ? err.message : err,
		);
		return [];
	}
}
