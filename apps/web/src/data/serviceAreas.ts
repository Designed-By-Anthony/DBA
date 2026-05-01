export type ServiceArea = {
	slug: string;
	name: string;
	state: string;
	tagline: string;
	description: string;
	sections: { heading: string; body: string }[];
};

export const SERVICE_AREAS: ServiceArea[] = [
	{
		slug: "rome-ny",
		name: "Rome",
		state: "NY",
		tagline: "Home base — where every build starts.",
		description:
			"Rome is where ANTHONY. is headquartered. We know the corridors, the contractors, and the seasonal rhythm of Oneida County better than anyone.",
		sections: [
			{
				heading: "Why Rome businesses need a site that works harder",
				body: "Fort Drum traffic, Turning Stone visitors, and the revitalization along Erie Boulevard have created real opportunity — but only if searchers can find you before a competitor in Utica or Syracuse. A properly structured website with Map Pack–optimized service pages and schema markup means you show up when someone types 'electrician near me' from the Comfort Suites parking lot.",
			},
			{
				heading: "Neighborhoods and corridors we know",
				body: "From Black River Boulevard to Wright Settlement, outer Erie Blvd to the Bellamy Harbour district — we build pages that reference the geography your customers actually search. That specificity is what separates a service-area page Google rewards from one it ignores.",
			},
			{
				heading: "Industries thriving in Rome",
				body: "Home-service contractors, dental practices along Erie, HVAC companies covering the Fort Stanwix corridor, salons in the Westmoreland corridor, and boutique retail downtown. Each vertical has a different search pattern — we align your site structure to the one that matters.",
			},
			{
				heading: "Seasonal patterns",
				body: "Spring brings roofing and landscaping surges. Summer tourists increase foot traffic to restaurants and salons. Fall heating-season prep drives HVAC leads. Winter plowing and emergency-repair keywords spike. We schedule content and GBP posts around these windows so you are visible when demand peaks.",
			},
		],
	},
	{
		slug: "utica-ny",
		name: "Utica",
		state: "NY",
		tagline: "The valley's anchor city — and a search market worth winning.",
		description:
			"Utica's downtown revitalization and Nexus Center development have brought new energy and new searchers. A tight website and local SEO program puts you in front of them.",
		sections: [
			{
				heading: "Why Utica is a competitive search market",
				body: "Utica punches above its weight in local search volume. Between Mohawk Valley Health System, SUNY Poly, and the Nexus Center corridor, there are thousands of transient and new-resident searchers every month who do not have a go-to plumber, stylist, or dentist yet. Your site is your first impression.",
			},
			{
				heading: "Neighborhoods we target",
				body: "Proctor Park, Corn Hill, South Utica, North Utica, West Utica, East Utica, Bagg's Square, the Genesee Street corridor, and the Bleecker Street restaurant row. Each neighborhood carries distinct search intent, and we build landing pages that reflect it.",
			},
			{
				heading: "Local industries we serve",
				body: "Restaurants on Bleecker Street, medical practices near St. Elizabeth's, salons along Genesee, contractors serving the Whitesboro Road corridor, and boutique shops in Bagg's Square. We match your site's service pages to the way your actual customers search.",
			},
			{
				heading: "GBP and review strategy",
				body: "Utica's Google Business Profile landscape is dense. We audit your category, photos, services, and review-response cadence, then align it all with your site so Google sees one consistent entity — not conflicting signals.",
			},
		],
	},
	{
		slug: "syracuse-ny",
		name: "Syracuse",
		state: "NY",
		tagline: "Central New York's largest market — and its most contested.",
		description:
			"Syracuse is the commercial center of CNY. Competition for Map Pack slots is fierce, which means your website and GBP have to be tighter than the next shop.",
		sections: [
			{
				heading: "The Syracuse search landscape",
				body: "With Syracuse University, Upstate Medical, and Destiny USA generating constant search traffic, the top three Map Pack slots in most service categories are worth real revenue. A generic Wix template does not get you there — structured service pages, schema, and entity consistency do.",
			},
			{
				heading: "Target neighborhoods",
				body: "Armory Square, Eastwood, Westcott, Tipperary Hill, North Side, Hawley-Green, Strathmore, Sedgwick, Lyncourt, and the Erie Boulevard commercial strip. We create neighborhood-aware landing pages that capture searches with geographic qualifiers.",
			},
			{
				heading: "Industries we work with",
				body: "Medspas in Fayetteville, contractors along Erie, restaurants in Armory Square, dental offices in DeWitt, and boutique retail in the Westcott district. Each one has a different keyword universe — we map yours before writing a single line of code.",
			},
			{
				heading: "What sets you apart in a crowded market",
				body: "Speed, structure, and depth. Your site loads in under two seconds. Your service pages answer the exact questions searchers are asking. Your schema tells Google exactly who you are, what you do, and where you do it. That is what moves the needle in Syracuse.",
			},
		],
	},
	{
		slug: "new-hartford-ny",
		name: "New Hartford",
		state: "NY",
		tagline: "Affluent suburb, high-intent searchers.",
		description:
			"New Hartford's commercial center along Commercial Drive and the Sangertown Square corridor serves a higher-income demographic that expects polished digital experiences.",
		sections: [
			{
				heading: "Why New Hartford matters",
				body: "The Sangertown Square and Commercial Drive corridor is the retail and service hub for south Oneida County. Shoppers there have above-average household income and are actively searching for quality service providers. If your site looks dated or loads slowly, they move to the next result.",
			},
			{
				heading: "Local search patterns",
				body: "Searches originating from New Hartford tend to include terms like 'near me,' 'best,' and service-specific qualifiers. We build pages that align with those high-intent modifiers so your business captures the click.",
			},
			{
				heading: "Industries we serve here",
				body: "Dental and medical offices on Campion Road, salons along Commercial Drive, home-service contractors serving the residential areas off Oxford Road and Kellogg Road, and boutique retail in the Paris Road corridor.",
			},
		],
	},
	{
		slug: "clinton-ny",
		name: "Clinton",
		state: "NY",
		tagline: "College town visibility with a village feel.",
		description:
			"Hamilton College brings a constant flow of visitors, parents, and prospective students through Clinton — your business should be the one they find first.",
		sections: [
			{
				heading: "Clinton's unique search opportunity",
				body: "Hamilton College alumni weekends, admissions visits, and the seasonal influx of families create spikes of high-intent local searches. Restaurants, salons, and lodging businesses that show up in those windows capture traffic that most competitors miss entirely.",
			},
			{
				heading: "Village-level targeting",
				body: "Clinton's compact size means Google often returns results from Utica or New Hartford for village searches. A properly optimized GBP with Clinton-specific landing pages and schema can pull your business to the top of results for people standing on College Street.",
			},
			{
				heading: "Who we help in Clinton",
				body: "Restaurants on the village green, bed-and-breakfasts, home contractors in the surrounding Kirkland area, professional services, and artisan shops. We tailor the SEO approach to the seasonal and academic calendar that drives foot traffic.",
			},
		],
	},
	{
		slug: "north-country-ny",
		name: "North Country",
		state: "NY",
		tagline: "Fort Drum, Watertown, and the military corridor.",
		description:
			"The Fort Drum region has a transient population that searches for everything — from off-post housing to a trustworthy mechanic. If your site is not optimized for that audience, someone else's is.",
		sections: [
			{
				heading: "The Fort Drum search economy",
				body: "Over 20,000 active-duty soldiers and their families rotate through Fort Drum. Every PCS cycle brings thousands of new searchers who need dentists, mechanics, restaurants, daycare, and home services. These are high-intent, time-sensitive searches — and the business with the best Map Pack presence wins.",
			},
			{
				heading: "Geographic coverage",
				body: "Watertown, Carthage, Lowville, Evans Mills, Black River, Sackets Harbor, and the Route 11 corridor. We build location-specific pages that capture searches from each community — not a single generic 'North Country' page that ranks for nothing.",
			},
			{
				heading: "Military family–friendly messaging",
				body: "Service members and their families respond to clear pricing, fast turnaround, and businesses that understand military schedules. We help you communicate those values on your site and in your GBP description so you stand out from the noise.",
			},
		],
	},
	{
		slug: "naples-fl",
		name: "Naples",
		state: "FL",
		tagline: "Gulf Coast luxury market — premium expectations.",
		description:
			"Naples searchers expect polished, fast, mobile-first experiences. A site that loads slowly or looks templated loses the click to a competitor before the first scroll.",
		sections: [
			{
				heading: "Why Naples is different",
				body: "Naples, FL, has one of the highest median household incomes in the country. Searchers here are sophisticated and comparison-shop aggressively. Your site needs to load in under two seconds, look custom, and communicate trust — testimonials, licensing, and portfolio — above the fold.",
			},
			{
				heading: "Target corridors",
				body: "Fifth Avenue South, Third Street, US-41 Tamiami Trail, Pine Ridge Road, Immokalee Road corridor, Vanderbilt Beach Road, and the Park Shore / Pelican Bay residential areas. We build landing pages tied to the commercial and residential zones where your customers live and search.",
			},
			{
				heading: "Industries we serve in Naples",
				body: "Medspas, luxury home services, pool and lanai contractors, interior designers, boutique retail on Fifth Avenue, dental cosmetics practices, and waterfront property services. Each has a distinct seasonal curve and keyword set that we map before building.",
			},
			{
				heading: "Seasonal search patterns",
				body: "Snowbird season (November–April) doubles the local population and spikes service searches. We time your content calendar, GBP posts, and ad campaigns around these waves so you capture peak demand.",
			},
		],
	},
	{
		slug: "houston-tx",
		name: "Houston",
		state: "TX",
		tagline: "Fourth-largest city, hyper-competitive local search.",
		description:
			"Houston's sprawl means hyper-local targeting is everything. A site that ranks in Katy does not automatically rank in The Woodlands — we build for the zip codes that matter to your business.",
		sections: [
			{
				heading: "Houston's search complexity",
				body: "Houston is not one market — it is dozens of overlapping micro-markets. Inner Loop, Galleria, Katy, Sugar Land, The Woodlands, Pearland, Cypress, and Spring each have their own search ecosystems. A single homepage cannot rank in all of them. We build geo-targeted service pages that compete in each zone.",
			},
			{
				heading: "Industries we serve in Houston",
				body: "HVAC contractors (a year-round necessity), roofing companies, medspas in the Galleria and River Oaks corridors, dental practices in Sugar Land and Katy, and home-service businesses across the Energy Corridor.",
			},
			{
				heading: "Why structure matters more here",
				body: "Houston's volume of competitors means Google needs unambiguous signals to rank you. That means clean schema, consistent NAP across citations, location-specific content that is not thin or duplicated, and a fast site that does not hemorrhage Core Web Vital scores on mobile.",
			},
		],
	},
	{
		slug: "miami-fl",
		name: "Miami",
		state: "FL",
		tagline: "Bilingual market, premium aesthetics, fierce competition.",
		description:
			"Miami's local search landscape is bilingual, design-forward, and brutally competitive. Your site has to look the part and rank in both English and Spanish search contexts.",
		sections: [
			{
				heading: "The Miami digital landscape",
				body: "Miami's searchers expect visual polish. A slow, cluttered site with stock photography gets bounced. We build fast, image-rich layouts that load in under two seconds and communicate credibility the way Miami's market demands — clean lines, bold type, and real project photography.",
			},
			{
				heading: "Bilingual search considerations",
				body: "A significant share of Miami searches happen in Spanish. If your competitors have Spanish-language service pages and you do not, you are invisible to a large segment of your market. We help you build bilingual content that is authentic — not Google Translated.",
			},
			{
				heading: "Target corridors",
				body: "Brickell, Wynwood, Coral Gables, Coconut Grove, South Beach, Doral, Kendall, Hialeah, and the Design District. Each neighborhood has distinct demographics and search patterns. We build landing pages that speak to each one.",
			},
			{
				heading: "Industries we work with in Miami",
				body: "Medspas and cosmetic clinics in Brickell, restaurants and nightlife in Wynwood, luxury home services in Coral Gables, boutique retail in the Design District, and contractors across Doral and Kendall.",
			},
		],
	},
	{
		slug: "columbus-oh",
		name: "Columbus",
		state: "OH",
		tagline: "Fast-growing Midwest market with room to claim territory.",
		description:
			"Columbus is one of the fastest-growing cities in the Midwest. New residents mean new searches — and the businesses that claim those Map Pack slots now will hold them.",
		sections: [
			{
				heading: "Columbus's growth advantage",
				body: "Ohio State, Nationwide, and the tech corridor have fueled steady population growth. Every new resident is a searcher who does not have a go-to dentist, HVAC tech, or salon yet. First impressions matter — and your website is the first impression.",
			},
			{
				heading: "Neighborhoods and suburbs we target",
				body: "Short North, German Village, Clintonville, Grandview Heights, Upper Arlington, Dublin, Westerville, Gahanna, and Hilliard. Each has its own search personality. We build pages that match neighborhood-level intent so you rank where your trucks actually roll.",
			},
			{
				heading: "Industries we serve in Columbus",
				body: "Home-service contractors, HVAC and plumbing companies, salons in the Short North, dental offices in Dublin and Westerville, medspas in the Polaris corridor, and restaurants across the metro. We align your site structure with the keywords that drive revenue in each zone.",
			},
		],
	},
	{
		slug: "manhattan-ny",
		name: "Manhattan",
		state: "NY",
		tagline: "The hardest local search market in the country.",
		description:
			"Manhattan's density and competition make local SEO a precision discipline. Every pixel, every millisecond, and every schema property matters.",
		sections: [
			{
				heading: "Why Manhattan is a different game",
				body: "The sheer density of businesses per block means Google has thousands of candidates for every local query. Winning a Map Pack slot in Manhattan requires flawless technical SEO, a deep review profile, and a site that loads faster than the next ten competitors. We build for that standard.",
			},
			{
				heading: "Neighborhood-level precision",
				body: "Tribeca, SoHo, the West Village, Chelsea, Midtown, the Upper East Side, the Upper West Side, Harlem, the Financial District, and the Lower East Side. Each neighborhood is its own search market. A single 'Manhattan' page does not cut it — we build neighborhood-specific content.",
			},
			{
				heading: "Industries we serve in Manhattan",
				body: "Boutique retail, luxury salons and spas, medical and dental cosmetics, co-working and event spaces, specialty food and beverage, and professional services. Each vertical has its own competitive dynamics — we map the SERP before we write code.",
			},
			{
				heading: "Speed as a competitive weapon",
				body: "Manhattan searchers are on mobile, on LTE, and impatient. A site that takes four seconds to load loses 50% of visitors before the hero finishes rendering. We ship sub-two-second loads with edge caching, optimized images, and zero layout shift.",
			},
		],
	},
];
