import { CONTACT_EMAIL, SUPPORT_LINK_URL, SUPPORT_LIVE } from "@/lib/constants";

/** The dedicated "support the project" section on the Account page — not a banner, so it only
 *  shows up for someone who's already looking at their account, never interrupting a task. */
export function SupportProjectSection() {
  return (
    <section
      id="support"
      className="kp-glass mt-4 overflow-hidden rounded-3xl p-5"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
        Support Philatrail
      </p>
      <h2 className="mt-2 text-xl font-bold leading-6">
        Philatrail is free. Keeping it that way costs a little.
      </h2>
      <p className="mt-2 text-sm leading-5 text-muted">
        I built Philatrail on my own, alongside a day job, because I wanted a
        proper map and tracker for the Philately Passport and couldn&apos;t
        find one. It stays free for every collector, full stop. If it&apos;s
        helped you fill a few pages, a small contribution helps keep it
        running and growing.
      </p>

      <ul className="mt-4 space-y-3">
        <li>
          <p className="text-sm font-semibold">Keeping it running</p>
          <p className="text-xs leading-5 text-muted">
            Hosting, the database, map tiles and the domain — the always-on
            costs that don&apos;t go away between updates.
          </p>
        </li>
        <li>
          <p className="text-sm font-semibold">Getting to iOS</p>
          <p className="text-xs leading-5 text-muted">
            Philatrail only runs on Android today. An Apple developer account
            is the one thing standing between here and an iPhone app.
          </p>
        </li>
        <li>
          <p className="text-sm font-semibold">Growing to new states</p>
          <p className="text-xs leading-5 text-muted">
            Each new state means sourcing and verifying its own passport
            booklet in person before its post offices can go on the map.
          </p>
        </li>
      </ul>

      {SUPPORT_LIVE ? (
        <a
          href={SUPPORT_LINK_URL}
          target="_blank"
          rel="noopener"
          className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold text-white"
        >
          Contribute
        </a>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#785a1e]/10 px-4 py-3 text-xs leading-5 text-muted">
          The give-link isn&apos;t set up yet — check back soon.
        </p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          Can&apos;t contribute money? You can still help
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted">
          <li>Use the app and report anything broken or confusing</li>
          <li>Help verify a new state&apos;s post offices and booklet</li>
          <li>Tell another collector about Philatrail</li>
          <li>
            Design or development feedback is always welcome —{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              get in touch
            </a>
          </li>
        </ul>
      </details>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          Questions
        </summary>
        <div className="mt-2 space-y-3 text-xs leading-5 text-muted">
          <p>
            <strong className="text-ink">
              Is this a registered charity?
            </strong>{" "}
            No — Philatrail is an independent, one-person project, not a
            registered nonprofit. Contributions aren&apos;t tax-deductible.
          </p>
          <p>
            <strong className="text-ink">Who&apos;s behind this?</strong>{" "}
            Bhavishya, a collector who built Philatrail because the Philately
            Passport needed a proper map and tracker.
          </p>
          <p>
            <strong className="text-ink">Where does the money go?</strong>{" "}
            Straight to the costs above — hosting, the iOS developer account,
            and travel to verify new states.
          </p>
        </div>
      </details>
    </section>
  );
}
