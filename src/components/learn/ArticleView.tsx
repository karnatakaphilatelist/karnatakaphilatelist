import Link from "next/link";
import { Appear } from "@/components/motion/Appear";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { ShareLearnButton } from "@/components/learn/ShareLearnButton";
import { DISCLAIMER } from "@/lib/constants";
import { BOOKLET_OUTLETS, BUREAU, mapsUrl, telUrl } from "@/lib/booklet";
import type { Article, Block } from "@/lib/learn-articles";

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
const OUTLINE = `${BUTTON} border-[1.5px] border-ink/25 text-ink`;
const H2 = "mt-8 font-display text-xl font-bold";
const CARD =
  "rounded-2xl bg-white/70 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]";

function Outlets() {
  return (
    <ul className="mt-4 space-y-3">
      {BOOKLET_OUTLETS.map((outlet) => (
        <li key={outlet.name} className={`${CARD} p-4`}>
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
  );
}

function Bureau() {
  return (
    <>
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
        <a href={telUrl(BUREAU.phone)} className={OUTLINE}>
          Call {BUREAU.phone}
        </a>
      </div>
    </>
  );
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={index} className="mt-3 text-base leading-7">
          {block.text}
        </p>
      );
    case "h2":
      return (
        <h2 key={index} className={H2}>
          {block.text}
        </h2>
      );
    case "ol":
      return (
        <ol
          key={index}
          className="mt-3 list-decimal space-y-1.5 pl-5 text-base leading-7"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "ul":
      return (
        <ul
          key={index}
          className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-7"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "terms":
      return (
        <dl key={index} className="mt-3 space-y-3 text-base leading-7">
          {block.items.map((item) => (
            <div key={item.term}>
              <dt className="font-bold">{item.term}</dt>
              <dd className="text-muted">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      );
    case "outlets":
      return <Outlets key={index} />;
    case "bureau":
      return <Bureau key={index} />;
    case "link":
      return (
        <p key={index} className="mt-3 text-base leading-7">
          <Link href={block.href} className="font-bold underline">
            {block.text}
          </Link>
        </p>
      );
  }
}

/** One Learn article: public, no sign-in, shareable, and ending with a next step. */
export function ArticleView({ article }: { article: Article }) {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
        <Link
          href="/learn"
          className="kp-hit -ml-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-muted"
        >
          <ArrowLeftIcon className="size-4" />
          Learn
        </Link>
        <Appear index={0}>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            {article.minutes} min read
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
            {article.title}
          </h1>
          <ShareLearnButton
            className="mt-4"
            path={`/learn/${article.slug}`}
            title={article.title}
            text={`${article.title}: ${article.summary}`}
            label="Share this article"
          />
        </Appear>

        <Appear index={1}>
          <div>{article.blocks.map(renderBlock)}</div>
        </Appear>

        <section
          className={`${CARD} mt-10 rounded-3xl p-5 text-center`}
          aria-label="Next step"
        >
          <Link
            href={article.next.href}
            className={`${BUTTON} min-h-12 bg-postal px-6 text-base text-white`}
          >
            {article.next.label}
          </Link>
          <div className="mt-3">
            <ShareLearnButton
              path={`/learn/${article.slug}`}
              title={article.title}
              text={`${article.title}: ${article.summary}`}
              label="Send this to a friend"
            />
          </div>
        </section>

        <section className="mt-10" aria-labelledby="sources-heading">
          <h2
            id="sources-heading"
            className="text-sm font-bold uppercase tracking-[0.14em] text-muted"
          >
            Read more
          </h2>
          <ul className="mt-2 space-y-1">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kp-hit inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
          Details come from the sources above and may change. {DISCLAIMER}
        </p>
      </article>
    </div>
  );
}
