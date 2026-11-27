import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { WebSignInNudge } from "@/components/web/WebSignInNudge";
import { DISCLAIMER, OG_IMAGE, SITE_URL } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";
import { breadcrumbJsonLd } from "@/lib/seo";

const PATH = "/tamil-nadu-philately-passport";
const TITLE =
  "Tamil Nadu Philately Passport: the 58 post offices, a map and a tracker";
const DESCRIPTION =
  "The Tamil Nadu Philately Passport is a booklet from Tamil Nadu Postal Circle listing 58 post offices across the state. See how it works and find all 58 offices on a map.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    siteName: "Philatrail",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is the Tamil Nadu Philately Passport?",
    a: "It is a pocket-sized booklet from Tamil Nadu Postal Circle, on sale since 28 October 2026. It lists 58 post offices across Tamil Nadu. At each one you buy a postage stamp and get that office's pictorial postmark struck in the booklet.",
  },
  {
    q: "Where can I buy the Tamil Nadu Philately Passport?",
    a: "It launched at the Chennai GPO Philatelic Bureau. Call or visit ahead to confirm stock, price and whether other head post offices have started selling it too.",
  },
  {
    q: "Do I need the booklet to use Philatrail?",
    a: "The booklet is the real collection. Philatrail is a free map and tracker that goes with it. It does not replace the booklet and does not issue postmarks.",
  },
  {
    q: "Is Philatrail official?",
    a: "No. Philatrail is an independent project. It is not made by, endorsed by or affiliated with India Post or Tamil Nadu Postal Circle.",
  },
  {
    q: "Are these all the post offices in Tamil Nadu?",
    a: "No. The Passport lists 58 chosen offices. Tamil Nadu has many more post offices.",
  },
];

export default async function TamilNaduPassportPillarPage() {
  const offices = await getPostOffices();
  const tnOffices = offices.filter((office) => office.state === "TN");
  const districts = new Set(tnOffices.map((office) => office.district)).size;

  return (
    <div className="h-full overflow-y-auto">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Philatrail", path: "/" },
          { name: "Tamil Nadu Philately Passport", path: PATH },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${SITE_URL}${PATH}`,
          mainEntity: FAQ.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }}
      />
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Tamil Nadu
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
          The Tamil Nadu Philately Passport
        </h1>
        <p className="mt-4 text-lg leading-8">
          The Tamil Nadu Philately Passport is a booklet from Tamil Nadu
          Postal Circle, on sale since 28 October 2026. It lists{" "}
          {tnOffices.length || 58} post offices across the state. At each one
          you buy a postage stamp and get that office&apos;s pictorial
          postmark struck in the booklet.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-white"
          >
            Open the map
          </Link>
          <Link
            href="/offices"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-5 font-bold"
          >
            See all {tnOffices.length || 58} offices
          </Link>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-base leading-7">
          <li>Buy the booklet at a participating post office or Philatelic Bureau.</li>
          <li>Travel to a place listed in it and find its post office.</li>
          <li>Buy a postage stamp and stick it on that place&apos;s page.</li>
          <li>Ask the staff for the place&apos;s pictorial postmark.</li>
          <li>Move on to the next place.</li>
        </ol>
        <p className="mt-3 text-base leading-7">
          Each postmark is available only at its own post office, so you have
          to go there. The booklet&apos;s own pages are the final word on any
          rules.
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold">
          Where to get the booklet
        </h2>
        <p className="mt-3 text-base leading-7">
          It launched at the Chennai GPO Philatelic Bureau. Stock and which
          other head post offices carry it can change, so call or visit
          ahead before you travel.
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold">
          The {tnOffices.length || 58} post offices
        </h2>
        <p className="mt-3 text-base leading-7">
          The list covers {districts || 28} districts, from Chennai and
          Madurai to Coimbatore, Thanjavur and Kanniyakumari. Browse them{" "}
          <Link href="/offices" className="font-bold underline">
            by district
          </Link>{" "}
          or find the ones near you on the{" "}
          <Link href="/explore" className="font-bold underline">
            map
          </Link>
          .
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold">
          Where Philatrail fits
        </h2>
        <p className="mt-3 text-base leading-7">
          Philatrail is a free, independent map and tracker for the Passport.
          It shows every office on a map, helps you plan the next trip and
          keeps count of the postmarks you have collected. It works without
          an account.
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold">
          Questions people ask
        </h2>
        <dl className="mt-3 space-y-5">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-bold">{q}</dt>
              <dd className="mt-1 text-base leading-7">{a}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 font-display text-2xl font-bold">
          New to philately?
        </h2>
        <p className="mt-3 text-base leading-7">
          Start with{" "}
          <Link href="/learn" className="font-bold underline">
            the beginner&apos;s guide
          </Link>
          . Looking for Karnataka instead? See{" "}
          <Link
            href="/karnataka-philately-passport"
            className="font-bold underline"
          >
            the Karnataka Philately Passport
          </Link>
          .
        </p>

        <p className="mt-10 text-sm leading-6 text-muted">{DISCLAIMER}</p>
      </article>
      <WebSignInNudge />
    </div>
  );
}
