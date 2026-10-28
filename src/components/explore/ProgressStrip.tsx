interface ProgressStripProps {
  /** Null while the session is loading, so nothing flashes. */
  signedIn: boolean | null;
  firstName: string | null;
  stamped: number;
  total: number;
  onFindNext: () => void;
  onSignIn: () => void;
}

/**
 * What a returning visitor sees above the list: their progress and the next step.
 * A guest with no stamps sees nothing, because the map speaks for itself.
 */
export function ProgressStrip({
  signedIn,
  firstName,
  stamped,
  total,
  onFindNext,
  onSignIn,
}: ProgressStripProps) {
  if (signedIn === null) return null;

  if (!signedIn) {
    if (stamped === 0) return null;
    return (
      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-planned-soft p-3">
        <p className="flex-1 text-sm leading-[18px] text-planned-ink">
          You have stamped {stamped} as a guest. Sign in so you do not lose{" "}
          {stamped === 1 ? "it" : "them"}.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="min-h-11 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  const percent = total > 0 ? Math.round((stamped / total) * 100) : 0;
  return (
    <section
      aria-label="Your progress"
      className="mb-2 rounded-2xl bg-sand p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {firstName ? `Namaskara, ${firstName}` : "Namaskara"}
          </p>
          <p className="text-sm text-muted">
            <span className="font-display text-lg font-bold text-ink">
              {stamped}
            </span>{" "}
            of {total} stamped
          </p>
        </div>
        {stamped < total ? (
          <button
            type="button"
            onClick={onFindNext}
            className="min-h-11 shrink-0 rounded-full bg-postal px-4 text-sm font-semibold text-white"
          >
            Find next
          </button>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label="Stamped post offices"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={stamped}
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-white"
      >
        <div
          className="h-full rounded-full bg-visited"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}
