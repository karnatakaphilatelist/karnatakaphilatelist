import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";
import { officePath } from "@/lib/seo";
import type { PostOffice } from "@/types";

const TITLE = "Karnataka Philately Passport: all post offices by district";

export async function generateMetadata(): Promise<Metadata> {
  const offices = await getPostOffices();
  const description = `All ${offices.length} post offices in Karnataka's Philately Passport, by district, with pincodes. Pick one, visit it and collect its postmark.`;
  return {
    title: TITLE,
    description,
    alternates: { canonical: "/offices" },
    openGraph: {
      type: "website",
      title: TITLE,
      description,
      url: "/offices",
      siteName: "Philatrail",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}

function byDistrict(offices: PostOffice[]): [string, PostOffice[]][] {
  const groups = new Map<string, PostOffice[]>();
  for (const office of offices) {
    groups.set(office.district, [
      ...(groups.get(office.district) ?? []),
      office,
    ]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "en"));
}

export default async function OfficesPage() {
  const offices = await getPostOffices();
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Karnataka
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
          {TITLE}
        </h1>
        <p className="mt-3 text-base leading-7">
          Karnataka Postal Circle&apos;s Philately Passport lists{" "}
          {offices.length} post offices at historical and tourist places. Here
          they are by district. Open one for its pincode, its neighbours and a
          link to the map. Want the overview first? Read about{" "}
          <Link
            href="/karnataka-philately-passport"
            className="font-bold underline"
          >
            the Karnataka Philately Passport
          </Link>
          . New to this?{" "}
          <Link href="/learn" className="font-bold underline">
            Read the beginner&apos;s guide
          </Link>
          .
        </p>

        {byDistrict(offices).map(([district, list]) => (
          <section
            key={district}
            className="mt-8"
            aria-labelledby={`d-${district}`}
          >
            <h2 id={`d-${district}`} className="font-display text-xl font-bold">
              {district}
            </h2>
            <ul className="mt-2 divide-y divide-ink/10">
              {list.map((office) => (
                <li key={office.id}>
                  <Link
                    href={officePath(office)}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-base"
                  >
                    <span className="font-semibold">{office.name}</span>
                    <span className="text-sm text-muted">{office.pincode}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
