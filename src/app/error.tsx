"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/** Shown when a page fails to render, most often because the office list could not load. */
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <div role="alert" className="grid h-full place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">We couldn&apos;t load the post offices</h1>
        <p className="mt-2 text-muted">Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 min-h-12 rounded-sm bg-postal px-6 text-base font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
