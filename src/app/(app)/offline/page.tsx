import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "No connection",
};

/**
 * Shown by the service worker when the app is offline and no cached version
 * of the requested page is available.
 */
export default function OfflinePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl" aria-hidden>
        📮
      </span>
      <h1 className="font-display text-2xl font-bold text-ink">
        No connection
      </h1>
      <p className="max-w-xs text-muted">
        Check your internet connection and try again. Your collected stamps are
        safely saved.
      </p>
      <a
        href="/explore"
        className="mt-2 inline-flex h-12 items-center rounded-full bg-postal px-6 text-sm font-bold uppercase tracking-[0.1em] text-white"
      >
        Try again
      </a>
    </div>
  );
}
