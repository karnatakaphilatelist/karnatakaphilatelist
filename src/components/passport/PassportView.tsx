"use client";

import Link from "next/link";
import { useState } from "react";
import { VisitDialog } from "@/components/office/VisitDialog";
import { DistrictProgress } from "@/components/passport/DistrictProgress";
import { ShareProgressSheet } from "@/components/passport/ShareProgressSheet";
import { StampDetailSheet } from "@/components/passport/StampDetailSheet";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStateOffices } from "@/components/providers/StateProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { AccountAvatar } from "@/components/layout/AccountAvatar";
import { Postmark } from "@/components/office/Postmark";
import { CheckIcon } from "@/components/ui/icons";
import { COMING_SOON_STATES } from "@/lib/states";
import { stateName } from "@/lib/states";
import { progressShareText, shareContent } from "@/lib/share";
import { useToast } from "@/components/providers/ToastProvider";
import { formatVisitDate } from "@/lib/date";
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
  const [showAll, setShowAll] = useState(false);
  const [stampFilter, setStampFilter] = useState<"all" | "stamped" | "togo">(
    "all"
  );

  const total = offices.length;
  const visitedOffices = offices.filter((office) => visits[office.id]);
  const upNext = offices
    .filter((office) => !visits[office.id])
    .slice(0, UP_NEXT_COUNT);
  const soonStates = COMING_SOON_STATES.filter(
    (code) => !states.some((state) => state.code === code)
  );
  const editingOffice =
    offices.find((office) => office.id === editingId) ?? null;

  if (!isReady) {
    return (
      <div role="status" className="grid h-full place-items-center text-muted">
        Loading your passport…
      </div>
    );
  }

  const sheets = (
    <>
      <ShareProgressSheet
        open={sharing}
        stamped={visitedOffices.length}
        total={total}
        stateName={stateName(stateCode)}
        onClose={() => setSharing(false)}
        onShare={async () => {
          const result = await shareContent({
            title: "Philatrail",
            text: progressShareText(
              visitedOffices.length,
              total,
              stateName(stateCode)
            ),
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
        onEdit={setEditingId}
      />
      <VisitDialog office={editingOffice} onClose={() => setEditingId(null)} />
    </>
  );
  const toGo = total - visitedOffices.length;
  const percent =
    total > 0
      ? Math.max(
          (visitedOffices.length / total) * 100,
          visitedOffices.length ? 4 : 0
        )
      : 0;
  const GLASS_TILE = "kp-glass rounded-2xl";
  const KICKER =
    "flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ink";

  if (showAll) {
    const shown =
      stampFilter === "stamped"
        ? visitedOffices
        : stampFilter === "togo"
        ? offices.filter((office) => !visits[office.id])
        : [
            ...visitedOffices,
            ...offices.filter((office) => !visits[office.id]),
          ];
    return (
      <div className="h-full overflow-y-auto px-4 pb-10 pt-6">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            aria-label="Back to passport"
            className="kp-glass grid size-11 place-items-center rounded-full text-ink"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <p className={`${KICKER} mt-6`}>
            {stateName(stateCode)}
            <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
            <span className="text-muted">
              {visitedOffices.length} of {total}
            </span>
          </p>
          <h1 className="-ml-0.5 mt-3 text-5xl font-medium uppercase leading-[52px] tracking-[0.01em]">
            Your stamps
          </h1>
          <div
            role="group"
            aria-label="Filter stamps"
            className="mt-4 flex gap-2"
          >
            {(
              [
                ["all", `All ${total}`],
                ["stamped", `Stamped ${visitedOffices.length}`],
                ["togo", `To go ${toGo}`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={stampFilter === value}
                onClick={() => setStampFilter(value)}
                className={`h-10 rounded-full px-4 text-[15px] ${
                  stampFilter === value
                    ? "bg-[#f3e2bd] font-bold shadow-[inset_0_0_0_1.5px_#16204f,0_2px_8px_rgb(0_0_0/0.12)]"
                    : "kp-glass font-semibold"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {shown.map((office) => {
              const visit = visits[office.id];
              return visit ? (
                <li key={office.id}>
                  <button
                    type="button"
                    onClick={() => setStampId(office.id)}
                    className={`${GLASS_TILE} flex w-full flex-col items-start p-4 text-left`}
                  >
                    <Postmark
                      name={office.name}
                      date={formatVisitDate(visit.visitedAt)}
                      pincode={office.pincode}
                      className="mx-auto size-[104px]"
                    />
                    <span className="mt-3 text-base font-semibold">
                      {office.name}
                    </span>
                    <span className="font-mono text-[13px] text-muted">
                      {formatVisitDate(visit.visitedAt)}
                    </span>
                  </button>
                </li>
              ) : (
                <li key={office.id}>
                  <Link
                    href={`/explore?office=${office.id}`}
                    className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-3 rounded-2xl outline-2 -outline-offset-2 outline-dashed outline-[#8f640f]/30"
                  >
                    <span
                      aria-hidden
                      className="size-[88px] rounded-full border-2 border-dashed border-[#8f640f]/30"
                    />
                    <span className="text-sm font-semibold text-muted">
                      {office.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {sheets}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="kp-red rounded-b-[28px] px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white">
        <div className="mx-auto max-w-2xl md:px-4">
          <div className="flex h-10 items-center justify-between md:hidden">
            <span className="text-xs font-extrabold uppercase tracking-[0.22em]">
              Philatrail
            </span>
            <AccountAvatar onWhite />
          </div>
          <p className="mt-4 flex items-center gap-3.5 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="opacity-85">My passport</span>
            <span aria-hidden className="h-4 w-px bg-[#f7c96b]" />
            <button
              type="button"
              onClick={() => setSharing(true)}
              className="-my-2.5 py-2.5 uppercase tracking-[0.18em]"
            >
              Share progress
            </button>
          </p>
          <div className="relative mt-3 flex h-14 items-center">
            <label htmlFor="state-passport" className="sr-only">
              State
            </label>
            <select
              id="state-passport"
              value={stateCode}
              onChange={(event) => choose(event.target.value)}
              className="h-14 w-full appearance-none bg-transparent pr-12 text-[clamp(30px,10vw,48px)] font-medium uppercase tracking-[0.01em] text-white [&>option]:text-ink -ml-0.5"
            >
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
              {soonStates.map((code) => (
                <option key={code} value={code} disabled>
                  {stateName(code)} · coming soon
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-0 grid size-9 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4 text-[#f7c96b]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-xl font-bold italic uppercase leading-6 tracking-[0.08em] text-[#f7c96b]">
            {visitedOffices.length} of {total}{" "}
            <span className="ml-1 text-xs font-normal tracking-[0.1em]">
              stamped
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Stamped post offices"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={visitedOffices.length}
            className="mt-6 h-1 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className="h-full min-w-2 rounded-full bg-[#f7c96b]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-center text-[11px] font-semibold uppercase leading-4 tracking-[0.22em] opacity-85">
            {toGo} to go
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-8">
        {!user && !isAuthLoading ? (
          <div className="kp-glass mb-8 flex items-center gap-3 rounded-2xl p-3.5">
            <p className="flex-1 text-sm leading-[18px] text-muted">
              You&apos;re browsing as a guest. Sign in to keep your passport on
              every device.
            </p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="min-h-11 shrink-0 rounded-full bg-postal px-4 text-sm font-bold text-white"
            >
              Sign in
            </button>
          </div>
        ) : null}

        {upNext.length > 0 ? (
          <section aria-labelledby="up-next-heading">
            <h2 id="up-next-heading" className={KICKER}>
              Up next
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {upNext.map((office) => (
                <Link
                  key={office.id}
                  href={`/explore?office=${office.id}`}
                  className="kp-glass flex h-10 items-center rounded-full px-3.5 text-sm font-semibold text-ink"
                >
                  {office.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="visited-heading" className="mt-10">
          <div className="flex items-center justify-between">
            <h2 id="visited-heading" className={KICKER}>
              Your stamps
            </h2>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="-my-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              See all
            </button>
          </div>
          {visitedOffices.length === 0 ? (
            <div className={`${GLASS_TILE} mt-4 p-6 text-center text-muted`}>
              <p>No stamps yet. Find a post office and tap Stamp it.</p>
              <Link
                href="/explore"
                className="mt-3.5 inline-flex min-h-12 items-center rounded-full bg-postal px-6 text-base font-bold text-white"
              >
                Open the map
              </Link>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {visitedOffices.slice(0, 6).map((office) => (
                <li key={office.id}>
                  <button
                    type="button"
                    onClick={() => setStampId(office.id)}
                    className="w-full text-left"
                  >
                    <span className={`${GLASS_TILE} relative block h-20`}>
                      <span className="absolute left-3 top-3 grid size-7 place-items-center rounded-full bg-[#1f8a4d] text-white">
                        <CheckIcon className="size-4" strokeWidth={3.4} />
                      </span>
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-5">
                      {office.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="districts-heading" className="mt-10">
          <h2 id="districts-heading" className={KICKER}>
            By district
          </h2>
          <div className="kp-glass mt-4 rounded-[18px] p-4">
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

      {sheets}
    </div>
  );
}
