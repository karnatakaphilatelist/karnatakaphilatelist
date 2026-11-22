import type { Metadata } from "next";
import Link from "next/link";
import { Appear } from "@/components/motion/Appear";
import { OG_IMAGE } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";
import { officePath } from "@/lib/seo";
import { stateName } from "@/lib/states";
import type { PostOffice } from "@/types";

const TITLE = "All Philately Passport post offices: Karnataka and Tamil Nadu";

export async function generateMetadata(): Promise<Metadata> {
  const offices = await getPostOffices();
  const description = `All ${offices.length} post offices of the Philately Passport in Karnataka and Tamil Nadu, by state and district, with pincodes. Pick one, visit it and collect its postmark.`;
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

/** States in a fixed display order (Karnataka first, the original state), each with its districts. */
function byState(offices: PostOffice[]): [string, PostOffice[]][] {
  const groups = new Map<string, PostOffice[]>();
  for (const office of offices) {
    groups.set(office.state, [...(groups.get(office.state) ?? []), office]);
  }
  const order = ["KA", "TN"];
  return [...groups.entries()].sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b)
  );
}

const PILLAR_PATH: Record<string, string> = {
  KA: "/karnataka-philately-passport",
  TN: "/tamil-nadu-philately-passport",
};

export default async function OfficesPage() {
  const offices = await getPostOffices();
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <Appear index={0}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Karnataka &amp; Tamil Nadu
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
            {TITLE}
          </h1>
          <p className="mt-3 text-base leading-7">
            {offices.length} post offices across both states&apos; Philately
            Passports, grouped by state and district. Open one for its
            pincode, its neighbours and a link to the map. New to this?{" "}
            <Link
              href="/learn"
              className="font-bold underline transition-opacity duration-150 hover:opacity-70"
            >
              Read the beginner&apos;s guide
            </Link>
            .
          </p>
        </Appear>

        {byState(offices).map(([state, stateOffices], stateIndex) => (
          <Appear key={state} index={stateIndex + 1}>
            <section className="mt-10" aria-labelledby={`s-${state}`}>
              <h2
                id={`s-${state}`}
                className="font-display text-2xl font-bold"
              >
                {stateName(state)}
              </h2>
              {PILLAR_PATH[state] && (
                <p className="mt-1 text-sm">
                  <Link
                    href={PILLAR_PATH[state]}
                    className="font-bold underline transition-opacity duration-150 hover:opacity-70"
                  >
                    About the {stateName(state)} Philately Passport
                  </Link>
                </p>
              )}
              {byDistrict(stateOffices).map(([district, list]) => (
                <section
                  key={district}
                  className="mt-6"
                  aria-labelledby={`d-${state}-${district}`}
                >
                  <h3
                    id={`d-${state}-${district}`}
                    className="font-display text-xl font-bold"
                  >
                    {district}
                  </h3>
                  <ul className="mt-2 divide-y divide-ink/10">
                    {list.map((office) => (
                      <li key={office.id}>
                        <Link
                          href={officePath(office)}
                          className="flex min-h-11 items-center justify-between gap-3 rounded-lg py-2 text-base transition-colors duration-150 active:bg-ink/5"
                        >
                          <span className="font-semibold">{office.name}</span>
                          <span className="text-sm text-muted">
                            {office.pincode}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </section>
          </Appear>
        ))}
      </div>
    </div>
  );
}
