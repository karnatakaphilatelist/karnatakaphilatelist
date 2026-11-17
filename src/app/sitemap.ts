import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";
import { officePath } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const offices = await getPostOffices();
  const page = (path: string, priority: number) => ({
    url: `${SITE_URL}${path}`,
    priority,
  });

  return [
    page("/", 1),
    page("/learn", 0.8),
    page("/offices", 0.8),
    page("/explore", 0.6),
    page("/privacy", 0.2),
    page("/terms", 0.2),
    ...offices.map((office) => page(officePath(office), 0.7)),
  ];
}
