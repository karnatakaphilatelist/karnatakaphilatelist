import Link from "next/link";
import { DISCLAIMER } from "@/lib/constants";
import {
  BOOKLET_OUTLETS,
  BOOKLET_PRICE_NOTE,
  BUREAU_EMAIL,
  mapsUrl,
} from "@/lib/booklet";

const KICKER = "text-xs font-bold uppercase tracking-[0.18em] text-muted";
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";

/** For people who found the app before the booklet: what the hobby is, where to buy it, who to ask. */
export function BookletGuide() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <p className={KICKER}>New to this?</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Get the booklet
        </h1>
        <p className="mt-3 text-base leading-7">
          Philatrail goes with the Philately Passport, a paper booklet sold by
          Karnataka Postal Circle. You can look around the app without it. The
          booklet is where your postmarks really live, and the app helps you
          fill it.
        </p>

        <section className="mt-8" aria-labelledby="what-heading">
          <h2 id="what-heading" className="font-display text-xl font-bold">
            What is this hobby?
          </h2>
          <div className="mt-2 space-y-3 text-base leading-7">
            <p>
              Philately is collecting stamps and postmarks, the inked marks a
              post office presses on mail. Every post office has its own, and
              some have a little picture of a nearby temple, fort or palace.
            </p>
            <p>
              The Philately Passport lists 100 post offices at historical and
              tourist places across Karnataka. At each one you buy a stamp and
              get that place&apos;s pictorial postmark struck in your booklet.
              It costs {BOOKLET_PRICE_NOTE}.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="where-heading">
          <h2 id="where-heading" className="font-display text-xl font-bold">
            Where to get it
          </h2>
          <p className="mt-2 text-base leading-7 text-muted">
            Reported on sale at these four post offices. Copies come in batches,
            so ask before you travel.
          </p>
          <ul className="mt-4 space-y-3">
            {BOOKLET_OUTLETS.map((outlet) => (
              <li
                key={outlet.name}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-4 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]"
              >
                <div className="min-w-0">
                  <p className="font-bold">{outlet.name}</p>
                  <p className="text-sm text-muted">{outlet.note}</p>
                </div>
                <a
                  href={mapsUrl(outlet.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Directions to ${outlet.name}`}
                  className={`${BUTTON} shrink-0 border-[1.5px] border-ink/25 text-ink`}
                >
                  Directions
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="ask-heading">
          <h2 id="ask-heading" className="font-display text-xl font-bold">
            Who to ask
          </h2>
          <p className="mt-2 text-base leading-7">
            For stock, price or opening hours, write to the Philatelic Bureau at
            Bengaluru GPO. It is where the booklet first went on sale.
          </p>
          <a
            href={`mailto:${BUREAU_EMAIL}?subject=${encodeURIComponent(
              "Philately Passport booklet"
            )}`}
            className={`${BUTTON} mt-3 bg-postal text-white`}
          >
            Email the bureau
          </a>
          <p className="mt-2 break-all text-sm text-muted">{BUREAU_EMAIL}</p>
        </section>

        <section className="mt-10 rounded-3xl bg-white/70 p-5 text-center shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]">
          <h2 className="font-display text-xl font-bold">
            Already have your booklet?
          </h2>
          <p className="mt-1.5 text-base text-muted">
            Find the post offices on the map and keep count as you go.
          </p>
          <Link
            href="/explore"
            className={`${BUTTON} mt-4 min-h-12 bg-postal px-6 text-base text-white`}
          >
            Open the map
          </Link>
        </section>

        <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
          Details come from news reports and may change. {DISCLAIMER}
        </p>
      </article>
    </div>
  );
}
