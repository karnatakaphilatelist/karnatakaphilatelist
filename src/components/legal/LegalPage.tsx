"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Appear } from "@/components/motion/Appear";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { DISCLAIMER } from "@/lib/constants";

/** Shared frame for the privacy policy and terms: a readable column that scrolls on its own. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-12 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
        {/* The gesture-only SwipeBackLayer has no desktop/mouse equivalent, and this
            page can be reached from several places (footer, account), so a fixed
            destination would be wrong as often as it's right — back is actually back. */}
        <button
          type="button"
          onClick={() => router.back()}
          className="kp-hit -ml-2 mb-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-muted"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
        <Appear index={0} className="mt-6 space-y-7 text-base leading-7">
          {children}
        </Appear>
        <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
          {DISCLAIMER}
        </p>
      </article>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
