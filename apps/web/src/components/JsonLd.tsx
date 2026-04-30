const STRUCTURED_DATA = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": "https://designedbyanthony.com/#website",
			name: "Designed by Anthony",
			url: "https://designedbyanthony.com",
			description:
				"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
			publisher: { "@id": "https://designedbyanthony.com/#organization" },
			inLanguage: "en-US",
		},
		{
			"@type": ["Organization", "LocalBusiness"],
			"@id": "https://designedbyanthony.com/#organization",
			name: "Designed by Anthony",
			url: "https://designedbyanthony.com",
			logo: {
				"@type": "ImageObject",
				url: "https://designedbyanthony.com/brand/logo.png",
			},
			image: "https://designedbyanthony.com/images/og-site-premium.png",
			description:
				"Full-service digital studio specializing in custom web design, local SEO, and technical performance audits for service businesses.",
			address: {
				"@type": "PostalAddress",
				addressLocality: "Utica",
				addressRegion: "NY",
				addressCountry: "US",
			},
			areaServed: {
				"@type": "GeoCircle",
				geoMidpoint: {
					"@type": "GeoCoordinates",
					latitude: 43.1009,
					longitude: -75.2327,
				},
				geoRadius: "80467",
			},
			sameAs: [
				"https://www.instagram.com/designedbyanthony_",
				"https://www.linkedin.com/company/designed-by-anthony",
			],
		},
	],
};

export function JsonLd() {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data requires raw JSON injection
			dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
		/>
	);
}
