"use client";

import Link from "next/link";
import { Postmark } from "@/components/office/Postmark";
import { PostmarkSpecimen } from "@/components/office/PostmarkSpecimen";
import { StatusBadge } from "@/components/office/StatusBadge";
import { useToast } from "@/components/providers/ToastProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  CheckIcon,
  CloseIcon,
  FlagIcon,
  AlertIcon,
  NavigationIcon,
  TargetIcon,
  ShareIcon,
  NoteIcon,
} from "@/components/ui/icons";
import {
  directionsUrl,
  formatDistance,
  formatShortDistance,
  proximity,
} from "@/lib/geo";
import { formatVisitDate } from "@/lib/date";
import { hasCoordinates } from "@/lib/office-status";
import { shareContent } from "@/lib/share";
import type { OfficeWithStatus } from "@/types";

interface OfficeDetailProps {
  office: OfficeWithStatus;
  onClose: () => void;
  onMarkVisited: (officeId: number) => void;
  onEditVisit?: (officeId: number) => void;
  /** Asks for the person's location so the banner can say whether they are at the office. */
  onCheckDistance?: () => void;
  /** Stamps collected in this state (including this one) and the state's total, for the stamped message. */
  collected?: number;
  total?: number;
  stateName?: string;
}

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10] ?? "th"}`;
}

/** Headline size follows the name's length so long names wrap to two lines at most. */
function headlineClass(name: string): string {
  if (name.length <= 10) return "text-[48px] leading-[52px]";
  if (name.length <= 16) return "text-[38px] leading-[42px]";
  return "text-[30px] leading-[34px]";
}

/** A small round glass button with a label underneath: the quiet actions of the card. */
const ROUND_BTN =
  "kp-glass grid size-14 place-items-center rounded-full text-ink";
const ROUND_LABEL =
  "text-[11px] font-semibold uppercase leading-3 tracking-[0.1em] text-muted";

/**
 * Details and actions for one office. A docked panel on phones (it sits on top of the tab bar),
 * a card floating over the map on larger screens.
 */
export function OfficeDetail({
  office,
  onClose,
  onMarkVisited,
  onCheckDistance,
  collected,
  total,
  stateName,
}: OfficeDetailProps) {
  const { visits, togglePlanned } = useVisits();
  const { showToast } = useToast();
  const visit = visits[office.id];
  const isPlanned = office.status === "planned";

  async function handleShare() {
    const result = await shareContent({
      title: "Philatrail",
      text: `I just stamped ${office.name}${
        stateName ? ` in ${stateName}` : ""
      } on Philatrail.`,
      url: window.location.origin,
    });
    if (result === "copied")
      showToast({ message: "Copied. Paste it anywhere to share." });
    if (result === "failed")
      showToast({ message: "Could not share. Please try again." });
  }

  return (
    <div
      role="region"
      aria-label={`${office.name} details`}
      className="kp-glass-panel absolute inset-x-0 bottom-0 z-[1100] flex max-h-[85%] animate-rise flex-col rounded-t-[28px] md:inset-x-auto md:bottom-auto md:left-14 md:top-4 md:max-h-[calc(100%-2rem)] md:w-96 md:rounded-2xl md:bg-white md:shadow-xl"
    >
      <div
        aria-hidden="true"
        className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#c7c7cc] md:hidden"
      />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-3">
        {/* Ghost stamp slot behind the headline: where the stamp will go. */}
        {!visit ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 top-8 h-[139px] w-[125px] rotate-6 rounded-md bg-white/40 outline-2 -outline-offset-[10px] outline-dashed outline-[#8f640f]/30"
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-3 pt-2">
          <h2
            className={`-ml-0.5 min-w-0 font-medium uppercase tracking-[0.01em] ${headlineClass(
              office.name
            )}`}
          >
            {office.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close post office details"
            className="kp-glass grid size-10 shrink-0 place-items-center rounded-full text-ink"
          >
            <CloseIcon className="size-4" strokeWidth={2.8} />
          </button>
        </div>
        <div className="relative">
          <p className="mt-2 flex items-center gap-2.5 text-sm leading-5 text-muted">
            <span>{office.district}</span>
            <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
            <span className="font-mono tracking-[0.08em]">
              {office.pincode || "No pincode"}
            </span>
            {office.distanceKm !== null ? (
              <>
                <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
                <span className="font-mono text-[13px] font-bold uppercase">
                  {formatDistance(office.distanceKm)}
                </span>
              </>
            ) : null}
          </p>
          {office.aboutPlace || office.stampImagePath ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase leading-3 tracking-[0.1em] text-muted">
                About this place
              </p>
              <div className="mt-1.5 flex items-start gap-3">
                {office.stampImagePath ? (
                  <PostmarkSpecimen
                    path={office.stampImagePath}
                    visited={Boolean(visit)}
                    name={office.name}
                  />
                ) : null}
                {office.aboutPlace ? (
                  <p className="min-w-0 flex-1 text-sm leading-5">
                    {office.aboutPlace}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusBadge
              status={office.status}
              stampedOn={visit ? formatVisitDate(visit.visitedAt) : undefined}
            />
            {visit ? (
              <>
                <p className="mt-3 text-sm leading-5">
                  {collected && total ? (
                    <>
                      Your {ordinal(collected)} stamp
                      {stateName ? ` in ${stateName}` : ""}.{" "}
                      {Math.max(total - collected, 0)} to go.
                    </>
                  ) : (
                    "Stamped in your passport."
                  )}
                </p>
              </>
            ) : null}
          </div>
          {visit ? (
            <Postmark
              name={office.name}
              date={formatVisitDate(visit.visitedAt)}
              pincode={office.pincode}
              className="size-[116px] shrink-0 animate-thump"
            />
          ) : null}
        </div>

        {!visit ? (
          <ProximityBanner
            km={office.distanceKm}
            onCheckDistance={onCheckDistance}
          />
        ) : null}
      </div>

      <div className="relative shrink-0 px-4 pb-4 pt-3">
        {visit ? (
          <>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
              >
                <ShareIcon className="size-5" strokeWidth={2.8} />
                Share stamp
              </button>
              <div className="flex w-14 flex-none flex-col items-center gap-2">
                <Link
                  href="/passport"
                  aria-label="Stamps"
                  className={ROUND_BTN}
                >
                  <NoteIcon className="size-[22px]" />
                </Link>
                <span className={ROUND_LABEL}>Stamps</span>
              </div>
              {hasCoordinates(office) ? <RouteButton office={office} /> : null}
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onMarkVisited(office.id)}
              className="flex h-[62px] flex-1 items-center justify-center gap-2 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal pl-1 text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
            >
              <CheckIcon className="size-5" strokeWidth={2.8} />
              Stamp it
            </button>
            <div className="flex w-14 flex-none flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => togglePlanned(office.id)}
                aria-pressed={isPlanned}
                aria-label={isPlanned ? "Remove from planned" : "Plan a visit"}
                className={`${ROUND_BTN} ${
                  isPlanned ? "ring-2 ring-[#2f4aa8]" : ""
                }`}
              >
                <FlagIcon className="size-[22px] text-[#2f4aa8]" />
              </button>
              <span className={ROUND_LABEL}>
                {isPlanned ? "Planned" : "Plan"}
              </span>
            </div>
            {hasCoordinates(office) ? <RouteButton office={office} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function RouteButton({
  office,
}: {
  office: OfficeWithStatus & { lat: number; lng: number };
}) {
  return (
    <div className="flex w-14 flex-none flex-col items-center gap-2">
      <a
        href={directionsUrl({ lat: office.lat, lng: office.lng })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Directions"
        className={ROUND_BTN}
      >
        <NavigationIcon className="size-[22px]" />
      </a>
      <span className={ROUND_LABEL}>Route</span>
    </div>
  );
}

/** Says whether the person is at the post office. It informs; it never blocks, so past visits can still be logged. */
function ProximityBanner({
  km,
  onCheckDistance,
}: {
  km: number | null;
  onCheckDistance?: () => void;
}) {
  const state = proximity(km);
  if (state === "unknown" || km === null) {
    return onCheckDistance ? (
      <button
        type="button"
        onClick={onCheckDistance}
        className="kp-glass mt-4 flex h-10 w-fit items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink"
      >
        <TargetIcon className="size-4 text-postal" />
        Check if you&apos;re here
      </button>
    ) : null;
  }
  if (state === "here") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-visited-soft p-3 text-sm font-semibold text-visited-ink">
        <CheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
        You&apos;re here · {formatShortDistance(km)} away. Ask for the postmark,
        then stamp it.
      </p>
    );
  }
  return (
    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-sm text-warn">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        <b>You&apos;re {formatDistance(km)} away.</b> Stamps are meant to be
        collected in person. You can still log a past visit.
      </span>
    </p>
  );
}
