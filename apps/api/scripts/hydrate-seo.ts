import { drizzle } from "drizzle-orm/d1";
import { seo_metadata } from "@dba/shared/src/db/schema";
import { eq } from "drizzle-orm";

// Mock D1 binding for local testing
const mockDB = {
  prepare: (query: string) => {
    return {
      bind: (...args: any[]) => {
        return {
          all: () => [],
          run: () => ({ success: true }),
        };
      },
    };
  },
};

// Initialize Drizzle ORM with D1 binding
const db = drizzle(mockDB);

// UPSERT SEO metadata for NY cities
async function hydrateSEOMetadata() {
  const cities = [
    {
      city: "Rome",
      areaCode: "315",
      slug: "rome",
      seoTitle: "Next-Gen Web Design in Rome, NY | The Atelier Experience",
      description: "Elevate your brand with cutting-edge web design solutions tailored for Rome, NY businesses. Experience the ANTHONY. difference.",
    },
    {
      city: "Utica",
      areaCode: "315",
      slug: "utica",
      seoTitle: "Premier Web Design Services in Utica, NY | ANTHONY. Atelier",
      description: "Transform your online presence with bespoke web design services in Utica, NY. Crafted by ANTHONY. for the modern entrepreneur.",
    },
    {
      city: "Syracuse",
      areaCode: "315",
      slug: "syracuse",
      seoTitle: "Innovative Web Design in Syracuse, NY | ANTHONY. Studio",
      description: "Unlock the potential of your Syracuse business with custom web design solutions. ANTHONY. delivers excellence in digital craftsmanship.",
    },
    {
      city: "Albany",
      areaCode: "518",
      slug: "albany",
      seoTitle: "Elite Web Design in Albany, NY | ANTHONY. Atelier",
      description: "Empower your Albany business with state-of-the-art web design. ANTHONY. blends creativity and technology for unparalleled results.",
    },
    {
      city: "Schenectady",
      areaCode: "518",
      slug: "schenectady",
      seoTitle: "Custom Web Design Solutions in Schenectady, NY | ANTHONY.",
      description: "Revolutionize your digital footprint with tailored web design services in Schenectady, NY. ANTHONY. crafts experiences that captivate.",
    },
    {
      city: "Troy",
      areaCode: "518",
      slug: "troy",
      seoTitle: "Modern Web Design in Troy, NY | ANTHONY. Studio",
      description: "Elevate your Troy business with contemporary web design solutions. ANTHONY. delivers innovation and precision in every project.",
    },
  ];

  for (const city of cities) {
    const pageUrl = `/locations/${city.slug}`;
    const existingMetadata = await db
      .select()
      .from(seo_metadata)
      .where(eq(seo_metadata.page_url, pageUrl))
      .get();

    if (existingMetadata) {
      await db
        .update(seo_metadata)
        .set({
          title: city.seoTitle,
          description: city.description,
          status: "Published",
        })
        .where(eq(seo_metadata.page_url, pageUrl))
        .run();
    } else {
      await db
        .insert(seo_metadata)
        .values({
          id: crypto.randomUUID(),
          page_url: pageUrl,
          title: city.seoTitle,
          description: city.description,
          status: "Published",
          created_at: Date.now(),
        })
        .run();
    }
  }
}

hydrateSEOMetadata().then(() => {
  console.log("SEO metadata hydration complete");
});