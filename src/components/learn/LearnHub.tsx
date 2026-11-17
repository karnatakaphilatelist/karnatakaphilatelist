import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { ShareLearnButton } from "@/components/learn/ShareLearnButton";
import { ARTICLES } from "@/lib/learn-articles";

/** The Learn tab: a short reading list that takes a newcomer from "what is this?" to "I have my booklet". */
export function LearnHub() {
  const [first, ...rest] = ARTICLES;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Learn
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
          Learn about philately
        </h1>
        <p className="mt-3 text-base leading-7">
          New to stamps and postmarks? Start here. A few short reads on the
          hobby, the Philately Passport and how to get your first postmark.
        </p>

        <Link
          href={`/learn/${first.slug}`}
          className="mt-6 block rounded-3xl bg-postal p-5 text-white active:opacity-90"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
            Start here · {first.minutes} min
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold leading-tight">
            {first.title}
          </p>
          <p className="mt-1 text-base text-white/90">{first.summary}</p>
        </Link>

        <ul className="mt-4 divide-y divide-line rounded-2xl bg-white/70 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]">
          {rest.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/learn/${article.slug}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{article.title}</span>
                  <span className="block text-sm text-muted">
                    {article.summary}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {article.minutes} min
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <ShareLearnButton
            path="/learn"
            title="Learn about philately"
            text="New to philately? Short reads on the hobby and Karnataka's Philately Passport."
            label="Share Learn with a friend"
          />
        </div>
      </div>
    </div>
  );
}
