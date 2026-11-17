import Link from "next/link";
import { DISCLAIMER } from "@/lib/constants";
import {
  BOOKLET_OUTLETS,
  BOOKLET_PRICE_NOTE,
  BUREAU,
  mapsUrl,
  telUrl,
} from "@/lib/booklet";
import { ShareLearnButton } from "@/components/learn/ShareLearnButton";

const KICKER = "text-xs font-bold uppercase tracking-[0.18em] text-muted";
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
const H2 = "font-display text-xl font-bold";
const CARD =
  "rounded-2xl bg-white/70 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]";

const WORDS: { term: string; meaning: string }[] = [
  {
    term: "Postmark",
    meaning:
      "The mark a post office strikes on mail, showing its name, pincode and date.",
  },
  {
    term: "Pictorial cancellation",
    meaning:
      "A postmark with a picture of a place or theme, such as a temple or a fort.",
  },
  {
    term: "Permanent Pictorial Cancellation",
    meaning:
      "A pictorial postmark kept for good at a post office near a heritage or tourist site. They began in 1951.",
  },
  {
    term: "Special cancellation",
    meaning:
      "A one-off postmark for an event or a stamp release, available only for a short time at named offices.",
  },
  {
    term: "Philatelic Bureau",
    meaning:
      "A post office counter built for collectors. It sells stamps and collector items and can issue special cancellations.",
  },
  {
    term: "First Day Cover",
    meaning:
      "An envelope with a new stamp on it, cancelled on the day that stamp was issued.",
  },
];

/** A shareable beginner's guide to philately and the Karnataka Philately Passport. Public, no sign-in. */
export function LearnGuide() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <p className={KICKER}>Learn about philately</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
          Philately in Karnataka: a beginner&apos;s guide
        </h1>
        <p className="mt-3 text-base leading-7">
          Collecting stamps and postmarks is an old hobby with a new reason to
          start. Karnataka Postal Circle now sells a Philately Passport that
          sends you to 100 post offices across the state. Here is what it all
          means, and where to begin.
        </p>
        <ShareLearnButton className="mt-4" />

        <section className="mt-8" aria-labelledby="what-heading">
          <h2 id="what-heading" className={H2}>
            What is philately?
          </h2>
          <div className="mt-2 space-y-3 text-base leading-7">
            <p>
              Philately is the collecting and study of postage stamps and
              related things: envelopes, postcards and the inked marks post
              offices press on mail. Someone who collects them is a philatelist.
            </p>
            <p>
              A stamp shows that postage was paid. A postmark, also called a
              cancellation, is the mark a post office adds. Every post office
              has its own, and some carry a small picture of a place nearby.
              Those pictures are what many people love collecting.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="passport-heading">
          <h2 id="passport-heading" className={H2}>
            The Karnataka Philately Passport
          </h2>
          <div className="mt-2 space-y-3 text-base leading-7">
            <p>
              The Philately Passport is a paper booklet sold by Karnataka Postal
              Circle. It lists 100 post offices at historical and tourist
              places. It costs {BOOKLET_PRICE_NOTE}.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Pick a post office from the booklet and go there.</li>
              <li>Buy a stamp at the counter.</li>
              <li>
                Ask for that place&apos;s pictorial postmark in your booklet.
              </li>
              <li>Move on to the next one.</li>
            </ol>
            <p>
              Philatrail is an independent app that goes with it. It shows the
              100 offices on a map, helps you plan visits and keeps count of the
              postmarks you collect.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="where-heading">
          <h2 id="where-heading" className={H2}>
            Where to get the booklet
          </h2>
          <p className="mt-2 text-base leading-7 text-muted">
            Reported on sale at these four post offices. Copies come in batches,
            so call or write before you travel.
          </p>
          <ul className="mt-4 space-y-3">
            {BOOKLET_OUTLETS.map((outlet) => (
              <li key={outlet.name} className={`${CARD} p-4`}>
                <p className="font-bold">{outlet.name}</p>
                <p className="text-sm text-muted">{outlet.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={telUrl(outlet.phone)}
                    aria-label={`Call ${outlet.name}, ${outlet.phone}`}
                    className={`${BUTTON} border-[1.5px] border-ink/25 text-ink`}
                  >
                    Call
                  </a>
                  <a
                    href={`mailto:${outlet.email}`}
                    aria-label={`Email ${outlet.name}`}
                    className={`${BUTTON} border-[1.5px] border-ink/25 text-ink`}
                  >
                    Email
                  </a>
                  <a
                    href={mapsUrl(outlet.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Directions to ${outlet.name}`}
                    className={`${BUTTON} border-[1.5px] border-ink/25 text-ink`}
                  >
                    Directions
                  </a>
                </div>
                <p className="mt-2 break-all text-xs text-muted">
                  {outlet.phone} · {outlet.email}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="ask-heading">
          <h2 id="ask-heading" className={H2}>
            Who to ask
          </h2>
          <p className="mt-2 text-base leading-7">
            For stock, price or opening hours, write to the Philatelic Bureau at
            Bengaluru GPO. It is where the booklet first went on sale.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`mailto:${BUREAU.email}?subject=${encodeURIComponent(
                "Philately Passport booklet"
              )}`}
              className={`${BUTTON} bg-postal text-white`}
            >
              Email the bureau
            </a>
            <a
              href={telUrl(BUREAU.phone)}
              className={`${BUTTON} border-[1.5px] border-ink/25 text-ink`}
            >
              Call {BUREAU.phone}
            </a>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="words-heading">
          <h2 id="words-heading" className={H2}>
            Words you will hear
          </h2>
          <dl className="mt-3 space-y-3 text-base leading-7">
            {WORDS.map((word) => (
              <div key={word.term}>
                <dt className="font-bold">{word.term}</dt>
                <dd className="text-muted">{word.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className={`${CARD} mt-10 rounded-3xl p-5 text-center`}
          aria-labelledby="start-heading"
        >
          <h2 id="start-heading" className={H2}>
            Ready to start?
          </h2>
          <p className="mt-1.5 text-base text-muted">
            Find the post offices on the map and keep count as you go. Know
            someone who would enjoy this? Send them the guide.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Link
              href="/explore"
              className={`${BUTTON} min-h-12 bg-postal px-6 text-base text-white`}
            >
              Open the map
            </Link>
            <ShareLearnButton />
          </div>
        </section>

        <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
          Details come from news reports and may change. {DISCLAIMER}
        </p>
      </article>
    </div>
  );
}
