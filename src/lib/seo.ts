import { SITE_URL } from "@/lib/constants";
import { distanceKm } from "@/lib/geo";
import { STATE_NAMES } from "@/lib/states";
import type { PostOffice } from "@/types";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The address of an office's public page, e.g. "agumbe-so-577411". The pincode keeps similar names apart. */
export function officeSlug(office: PostOffice): string {
  const name = slugify(office.name) || "post-office";
  return `${name}-${office.pincode || office.id}`;
}

export function officePath(office: PostOffice): string {
  return `/offices/${officeSlug(office)}`;
}

export function findOfficeBySlug(
  offices: PostOffice[],
  slug: string
): PostOffice | undefined {
  return offices.find((office) => officeSlug(office) === slug);
}

export function stateNameFor(office: PostOffice): string {
  return STATE_NAMES[office.state] ?? "India";
}

/** The closest other offices on the list, nearest first. Offices without coordinates are skipped. */
export function nearestOffices(
  office: PostOffice,
  offices: PostOffice[],
  count: number
): { office: PostOffice; km: number }[] {
  if (office.lat == null || office.lng == null) return [];
  const here = { lat: office.lat, lng: office.lng };
  return offices
    .filter(
      (other) => other.id !== office.id && other.lat != null && other.lng != null
    )
    .map((other) => ({
      office: other,
      km: distanceKm(here, { lat: other.lat as number, lng: other.lng as number }),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}

/** schema.org BreadcrumbList for a trail like Home > Learn > Article. `path` is the site path of each step. */
export function breadcrumbJsonLd(
  trail: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  };
}
