import { BOOKLET_OUTLETS, mapsUrl, telUrl } from "@/lib/booklet";
import { CONTACT_EMAIL } from "@/lib/constants";

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
const OUTLINE = `${BUTTON} border-[1.5px] border-ink/25 text-ink`;
const CARD =
  "rounded-2xl bg-white/70 p-4 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]";

/** The South India Philatelists' Association, who run the Tamil Nadu booklet. */
const SIPA = {
  name: "South India Philatelists' Association",
  careOf: "C/o Mr. C.G. Bhaskar",
  address: "No. 28, Bronson Garden Road, Kilpauk, Chennai - 600 010",
  mobiles: ["9840423567", "9444491111"],
  email: "sipagold@gmail.com",
};

/** The Contact Us screen: how to reach Philatrail, and the post offices and association behind the booklets. */
export function ContactView() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-12 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Contact us
        </h1>
        <p className="mt-3 text-base leading-7">
          Philatrail is an independent, volunteer-run project — not India Post
          or either philately association. Write to us about the app, or
          reach the offices below directly about booklets, stock or stamping.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">About the app</h2>
          <div className={`mt-3 ${CARD}`}>
            <p className="font-bold">Philatrail</p>
            <p className="mt-1 break-all text-sm text-muted">
              {CONTACT_EMAIL}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`mailto:${CONTACT_EMAIL}`} className={OUTLINE}>
                Email us
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">
            Karnataka post offices
          </h2>
          <p className="mt-2 text-sm text-muted">
            For booklet stock, price or opening hours.
          </p>
          <ul className="mt-3 space-y-3">
            {BOOKLET_OUTLETS.map((outlet) => (
              <li key={outlet.name} className={CARD}>
                <p className="font-bold">{outlet.name}</p>
                <p className="text-sm text-muted">{outlet.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={telUrl(outlet.phone)}
                    aria-label={`Call ${outlet.name}, ${outlet.phone}`}
                    className={OUTLINE}
                  >
                    Call
                  </a>
                  <a
                    href={`mailto:${outlet.email}`}
                    aria-label={`Email ${outlet.name}`}
                    className={OUTLINE}
                  >
                    Email
                  </a>
                  <a
                    href={mapsUrl(outlet.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Directions to ${outlet.name}`}
                    className={OUTLINE}
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

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">
            Tamil Nadu: South India Philatelists&rsquo; Association
          </h2>
          <div className={`mt-3 ${CARD}`}>
            <p className="font-bold">{SIPA.name}</p>
            <p className="text-sm text-muted">{SIPA.careOf}</p>
            <p className="text-sm text-muted">{SIPA.address}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIPA.mobiles.map((mobile) => (
                <a
                  key={mobile}
                  href={telUrl(mobile)}
                  aria-label={`Call ${SIPA.name}, ${mobile}`}
                  className={OUTLINE}
                >
                  Call {mobile}
                </a>
              ))}
              <a
                href={`mailto:${SIPA.email}`}
                aria-label={`Email ${SIPA.name}`}
                className={OUTLINE}
              >
                Email
              </a>
            </div>
            <p className="mt-2 break-all text-xs text-muted">
              Mobile: {SIPA.mobiles.join(", ")} · {SIPA.email}
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
