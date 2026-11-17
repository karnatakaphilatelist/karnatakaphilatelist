import Link from "next/link";
import "../landing/landing.css"; // reuses .kpl-btn for the closing CTAs
import "./learn.css";

const STEPS = [
  {
    title: "Find a post office on the list",
    text: "Karnataka's Philately Passport names about 100 post offices — not every post office in the state, a curated set chosen for their history or setting. Browse or search them on the map.",
  },
  {
    title: "Go there in person",
    text: "There's no shortcut here — the trip itself is the point. Plan a route, pick a few offices near each other, and make a day of it.",
  },
  {
    title: "Check in when you arrive",
    text: "Open the office in the app and tap to check in. Philatrail confirms you're actually near the post office before it lets you mark anything collected — that's what keeps this honest.",
  },
  {
    title: "Get your postmark",
    text: "At the counter, staff postmark your physical passport booklet (or your card, if that's what you're collecting on). Mark the office collected in the app, and watch your digital passport fill in alongside the real one.",
  },
];

/** The explainer behind "See how it works": what Philatrail is, the four steps, and the postmark/stamp distinction. */
export function Learn() {
  return (
    <div className="lrn">
      <svg className="lrn-grain" aria-hidden="true">
        <filter id="lrn-grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lrn-grain-filter)" />
      </svg>

      <header className="lrn-head">
        <Link href="/" className="lrn-logo" aria-label="Philatrail home" />
        <nav aria-label="Main" className="lrn-nav">
          <Link href="/explore">Explore</Link>
          <Link href="/passport">Passport</Link>
          <span aria-current="page">Learn</span>
        </nav>
      </header>

      <div className="lrn-intro">
        <p className="lrn-eyebrow">How it works</p>
        <h1>Philatrail is a digital companion to a real paper passport.</h1>
        <p>
          The Karnataka Postal Circle sells a physical Philately Passport
          booklet — about 100 post offices of historical or tourist
          significance, each one you visit in person and get stamped.
          Philatrail doesn&rsquo;t replace that booklet; it keeps the
          record, checks you were actually there, and shows you what&rsquo;s
          left to collect.
        </p>
      </div>

      <ol className="lrn-steps">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <p className="lrn-step-eyebrow">
              Step {index + 1} of {STEPS.length}
            </p>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="lrn-callout">
        <h3>A postmark, not a stamp</h3>
        <p>
          What you&rsquo;re collecting is a <b>postmark</b> (or cancellation)
          — the mark a post office strikes by hand, showing its name, PIN
          and date. Philatrail doesn&rsquo;t issue stamps; India Post does,
          at the counter. &ldquo;Stamp it&rdquo; is just how we talk about
          the moment — the real object stays physical.
        </p>
      </div>

      <div className="lrn-cta">
        <Link href="/explore" className="kpl-btn kpl-btn--red">
          Open the map
        </Link>
        <Link href="/passport" className="kpl-btn kpl-btn--line">
          My passport
        </Link>
      </div>
    </div>
  );
}
