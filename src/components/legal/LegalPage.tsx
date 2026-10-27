import type { ReactNode } from "react";

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
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 pb-12 pt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
        <div className="mt-6 space-y-7 text-base leading-7">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
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
