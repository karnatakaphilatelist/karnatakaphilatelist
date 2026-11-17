import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { DISCLAIMER, SITE_URL } from "@/lib/constants";
import { directionsUrl, formatDistance } from "@/lib/geo";
import { getPostOffices } from "@/lib/offices";
import {
  findOfficeBySlug,
  nearestOffices,
  officePath,
  officeSlug,
  stateNameFor,
} from "@/lib/seo";

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
const H2 = "font-display text-xl font-bold";

export async function generateStaticParams() {
  const offices = await getPostOffices();
  return offices.map((office) => ({ slug: officeSlug(office) }));
}

export async function generateMetadata(
  props: PageProps<"/offices/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const offices = await getPostOffices();
  const office = findOfficeBySlug(offices, slug);
  if (!office) return {};

  const state = stateNameFor(office);
  const title = `${office.name}, ${office.district} (${office.pincode})`;
  const description = `${office.name} post office in ${office.district}, ${state}, pincode ${office.pincode}. One of the ${offices.length} post offices in Karnataka's Philately Passport: how the visit works and which offices are nearby.`;
  return {
    title,
    description,
    alternates: { canonical: officePath(office) },
    openGraph: {
      type: "website",
      title,
      description,
      url: officePath(office),
      siteName: "Philatrail",
    },
  };
}

export default async function OfficePage(props: PageProps<"/offices/[slug]">) {
  const { slug } = await props.params;
  const offices = await getPostOffices();
  const office = findOfficeBySlug(offices, slug);
  if (!office) notFound();

  const state = stateNameFor(office);
  const hasPlace = office.lat != null && office.lng != null;
  const nearby = nearestOffices(office, offices, 4);

  return (
    <div className="h-full overflow-y-auto">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "PostOffice",
          name: office.name,
          url: `${SITE_URL}${officePath(office)}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: office.district,
            addressRegion: state,
            postalCode: office.pincode,
            addressCountry: "IN",
          },
          ...(hasPlace
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: office.lat,
                  longitude: office.lng,
                },
              }
            : {}),
        }}
      />
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/offices" className="underline">
            All post offices
          </Link>
        </nav>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">
          {office.district} · {state}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
          {office.name}
        </h1>
        <p className="mt-3 text-base leading-7">
          {office.name} is a post office in {office.district}, {state}, with the
          pincode {office.pincode}. It is one of the {offices.length} post
          offices in Karnataka Postal Circle&apos;s Philately Passport.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/explore?office=${office.id}`}
            className={`${BUTTON} bg-postal text-white`}
          >
            Open on the map
          </Link>
          {hasPlace && (
            <a
              href={directionsUrl({ lat: office.lat as number, lng: office.lng as number })}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BUTTON} border-[1.5px] border-ink/25 text-ink`}
            >
              Get directions
            </a>
          )}
        </div>

        {office.aboutPlace && (
          <section className="mt-8" aria-labelledby="about-heading">
            <h2 id="about-heading" className={H2}>
              Why this office is on the list
            </h2>
            <p className="mt-2 text-base leading-7">{office.aboutPlace}</p>
          </section>
        )}

        <section className="mt-8" aria-labelledby="visit-heading">
          <h2 id="visit-heading" className={H2}>
            How the visit works
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base leading-7">
            <li>Go to the post office with your Philately Passport booklet.</li>
            <li>Buy a stamp at the counter.</li>
            <li>Ask for this place&apos;s pictorial postmark in your booklet.</li>
          </ol>
          <p className="mt-3 text-base leading-7 text-muted">
            Opening hours and what is available can change, so check with the
            office before a long trip. Don&apos;t have the booklet yet? The{" "}
            <Link href="/learn" className="underline">
              beginner&apos;s guide
            </Link>{" "}
            says where it is sold.
          </p>
        </section>

        {nearby.length > 0 && (
          <section className="mt-8" aria-labelledby="nearby-heading">
            <h2 id="nearby-heading" className={H2}>
              Nearby on the trail
            </h2>
            <ul className="mt-2 divide-y divide-ink/10">
              {nearby.map(({ office: other, km }) => (
                <li key={other.id}>
                  <Link
                    href={officePath(other)}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-base"
                  >
                    <span>
                      <span className="font-semibold">{other.name}</span>
                      <span className="text-sm text-muted"> · {other.district}</span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">
                      {formatDistance(km)} away
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Distances are in a straight line, not by road.
            </p>
          </section>
        )}

        <p className="mt-10 text-xs leading-5 text-muted">{DISCLAIMER}</p>
      </article>
    </div>
  );
}
