"use client";

import Link from "next/link";
import { useState } from "react";
import { VisitDialog } from "@/components/office/VisitDialog";
import { DistrictProgress } from "@/components/passport/DistrictProgress";
import { ShareProgressSheet } from "@/components/passport/ShareProgressSheet";
import { StampDetailSheet } from "@/components/passport/StampDetailSheet";
import { ProgressRing } from "@/components/passport/ProgressRing";
import { VisitedCard } from "@/components/passport/VisitedCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStateOffices } from "@/components/providers/StateProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { StateSwitcher } from "@/components/ui/StateSwitcher";
import { stateName } from "@/lib/states";
import { progressShareText, shareContent } from "@/lib/share";
import { useToast } from "@/components/providers/ToastProvider";
import { DISCLAIMER } from "@/lib/constants";
import type { PostOffice } from "@/types";

const UP_NEXT_COUNT = 3;

export function PassportView({
  offices: indiaOffices,
}: {
  offices: PostOffice[];
}) {
  const {
    states,
    stateCode,
    stateOffices: offices,
    choose,
  } = useStateOffices(indiaOffices);
  const { user, isLoading: isAuthLoading, openSignIn } = useAuth();
  const { visits, isReady } = useVisits();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stampId, setStampId] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);

  const total = offices.length;
  const visitedOffices = offices.filter((office) => visits[office.id]);
  const upNext = offices
    .filter((office) => !visits[office.id])
    .slice(0, UP_NEXT_COUNT);
  const editingOffice =
    offices.find((office) => office.id === editingId) ?? null;

  if (!isReady) {
    return (
      <div role="status" className="grid h-full place-items-center text-muted">
        Loading your passport…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="kp-red px-5 pb-6 pt-6 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
            <div>
              <h1 className="text-5xl font-medium uppercase leading-[52px] tracking-[0.01em] -ml-0.5">
                {stateName(stateCode)}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                Every stamp you collect, in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSharing(true)}
              className="min-h-11 shrink-0 rounded-full bg-white/20 px-5 text-sm font-semibold text-white"
            >
              Share my progress
            </button>
          </div>
          <div className="mt-3 max-w-xs">
            <StateSwitcher
              states={states}
              value={stateCode}
              onChange={choose}
              idSuffix="passport"
              onRed
            />
          </div>
          <section
            aria-label="Overall progress"
            className="mt-5 flex items-center gap-5"
          >
            <ProgressRing visited={visitedOffices.length} total={total} onRed />
            <div>
              <p className="flex items-baseline gap-1.5 whitespace-nowrap font-bold leading-none">
                <span className="text-5xl font-semibold italic text-[#f7c96b]">
                  {visitedOffices.length}
                </span>
                <span className="text-lg font-semibold text-white/90">
                  of {total}
                </span>
              </p>
              <p className="mt-1 text-sm text-white/90">
                post offices stamped in {stateName(stateCode)}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {total - visitedOffices.length} to go
              </p>
            </div>
          </section>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-5">
        {!user && !isAuthLoading ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-planned-soft p-3.5">
            <p className="flex-1 text-sm leading-[18px] text-planned-ink">
              You&apos;re browsing as a guest. Sign in to keep your passport on
              every device.
            </p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="min-h-11 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </div>
        ) : null}


        {user ? (
          <p className="mt-4 text-sm text-muted">
            Signed in as {user.email ?? "you"}.{" "}
            <Link
              href="/account/password"
              className="font-semibold text-postal underline"
            >
              Set or change your password
            </Link>
          </p>
        ) : null}

        {upNext.length > 0 ? (
          <section aria-labelledby="up-next-heading" className="mt-7">
            <h2 id="up-next-heading" className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted before:h-px before:w-6 before:bg-[#b8861b]">
              Up next
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {upNext.map((office) => (
                <Link
                  key={office.id}
                  href={`/explore?office=${office.id}`}
                  className="flex min-h-11 items-center rounded-full kp-glass px-4 text-sm font-semibold text-ink"
                >
                  {office.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="visited-heading" className="mt-7">
          <h2 id="visited-heading" className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted before:h-px before:w-6 before:bg-[#b8861b]">
            Your stamps
          </h2>
          {visitedOffices.length === 0 ? (
            <div className="mt-2.5 kp-glass rounded-[18px] p-6 text-center text-muted">
              <p>No stamps yet. Find a post office and tap Stamp it.</p>
              <Link
                href="/explore"
                className="mt-3.5 inline-flex min-h-12 items-center rounded-full bg-postal px-6 text-base font-semibold text-white"
              >
                Open the map
              </Link>
            </div>
          ) : (
            <ul className="mt-2.5 space-y-3">
              {visitedOffices.map((office) => (
                <VisitedCard
                  key={office.id}
                  office={office}
                  visit={visits[office.id]}
                  onEdit={setEditingId}
                  onOpenStamp={setStampId}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="districts-heading" className="mt-7">
          <h2 id="districts-heading" className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted before:h-px before:w-6 before:bg-[#b8861b]">
            By district
          </h2>
          <div className="mt-3 kp-glass rounded-[18px] p-4">
            <DistrictProgress offices={offices} visits={visits} />
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-muted">
          <div className="flex justify-center gap-5">
            <Link
              href="/privacy"
              className="flex min-h-11 items-center underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="flex min-h-11 items-center underline"
            >
              Terms
            </Link>
          </div>
          <p className="mx-auto mt-3 max-w-md text-xs leading-5">
            {DISCLAIMER}
          </p>
        </footer>
      </div>

      <ShareProgressSheet
        open={sharing}
        stamped={visitedOffices.length}
        total={total}
        stateName={stateName(stateCode)}
        onClose={() => setSharing(false)}
        onShare={async () => {
          const result = await shareContent({
            title: "Philatrail",
            text: progressShareText(visitedOffices.length, total, stateName(stateCode)),
            url: window.location.origin,
          });
          setSharing(false);
          if (result === "copied")
            showToast({ message: "Copied. Paste it anywhere to share." });
          if (result === "failed")
            showToast({ message: "Could not share. Please try again." });
        }}
      />
      <StampDetailSheet
        office={offices.find((office) => office.id === stampId) ?? null}
        visit={stampId === null ? undefined : visits[stampId]}
        onClose={() => setStampId(null)}
      />
      <VisitDialog office={editingOffice} onClose={() => setEditingId(null)} />
    </div>
  );
}
