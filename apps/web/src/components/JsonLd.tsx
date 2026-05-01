import { buildBaseOrganizationSchema, buildBaseWebsiteSchema } from "@/lib/seo";

const ENTRIES = [buildBaseOrganizationSchema(), buildBaseWebsiteSchema()];

export function JsonLd() {
	return (
		<>
			{ENTRIES.map((entry) => {
				const id =
					typeof entry["@id"] === "string"
						? entry["@id"]
						: JSON.stringify(entry);
				return (
					<script
						key={id}
						type="application/ld+json"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data requires raw JSON injection
						dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
					/>
				);
			})}
		</>
	);
}
