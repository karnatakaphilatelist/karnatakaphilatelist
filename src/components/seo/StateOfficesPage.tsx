import Link from "next/link";
import { WebSignInNudge } from "@/components/web/WebSignInNudge";
import { DISCLAIMER } from "@/lib/constants";
import type { PassportState } from "@/lib/passport-states";
import { officePath } from "@/lib/seo";
import type { PostOffice } from "@/types";

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

/** Every office in one state's Philately Passport, as plain links, grouped by district. */
export function StateOfficesPage({
  state,
  offices,
}: {
  state: PassportState;
  offices: PostOffice[];
}) {
  const list = offices.filter((office) => office.state === state.code);
  const districts = byDistrict(list);
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href={state.path} className="underline">
            {state.name} Philately Passport
          </Link>
        </nav>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">
          {state.name} Philately Passport: all {list.length} post offices
        </h1>
        <p className="mt-4 text-lg leading-8">
          The {state.name} Philately Passport, from {state.circle}, lists{" "}
          {list.length} post offices across {districts.length} districts. Here
          they are by district, with pincodes. Open one to see how the visit
          works and which offices are nearby.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-white"
          >
            See them on the map
          </Link>
          <Link
            href={state.path}
            className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-5 font-bold"
          >
            About the {state.name} Philately Passport
          </Link>
        </div>

        {districts.map(([district, items]) => (
          <section
            key={district}
            className="mt-8"
            aria-labelledby={`d-${district}`}
          >
            <h2 id={`d-${district}`} className="font-display text-xl font-bold">
              {district}
            </h2>
            <ul className="mt-2 divide-y divide-ink/10">
              {items.map((office) => (
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

        <p className="mt-10 text-sm leading-6 text-muted">{DISCLAIMER}</p>
      </article>
      <WebSignInNudge />
    </div>
  );
}
