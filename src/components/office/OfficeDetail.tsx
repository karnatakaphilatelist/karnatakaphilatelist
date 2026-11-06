"use client";

import { StatusBadge } from "@/components/office/StatusBadge";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  CheckIcon,
  CloseIcon,
  FlagIcon,
  AlertIcon,
  GlobeIcon,
  LockIcon,
  NavigationIcon,
  TargetIcon,
} from "@/components/ui/icons";
import { directionsUrl, formatDistance, formatShortDistance, proximity } from "@/lib/geo";
import { hasCoordinates } from "@/lib/office-status";
import type { OfficeWithStatus } from "@/types";

interface OfficeDetailProps {
  office: OfficeWithStatus;
  onClose: () => void;
  onMarkVisited: (officeId: number) => void;
  onEditVisit: (officeId: number) => void;
  /** Asks for the person's location so the banner can say whether they are at the office. */
  onCheckDistance?: () => void;
}

const SECONDARY_BUTTON =
  "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-white text-sm font-semibold";

/**
 * Details and actions for one office. A bottom sheet on phones, a card
 * floating over the map on larger screens.
 */
export function OfficeDetail({
  office,
  onClose,
  onMarkVisited,
  onEditVisit,
  onCheckDistance,
}: OfficeDetailProps) {
  const { visits, togglePlanned, removeVisit } = useVisits();
  const visit = visits[office.id];
  const isPlanned = office.status === "planned";

  return (
    <div
      role="region"
      aria-label={`${office.name} details`}
      className="fixed inset-x-0 bottom-0 z-[1100] flex max-h-[85dvh] animate-rise flex-col kp-glass-panel rounded-t-3xl md:bg-white md:absolute md:inset-x-auto md:bottom-auto md:left-14 md:top-4 md:max-h-[calc(100%-2rem)] md:w-96 md:rounded-2xl md:shadow-xl"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
                        <div className="min-w-0">
              <h2 className="text-[40px] font-medium uppercase leading-[44px] tracking-[0.01em] -ml-0.5">
                {office.name}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                {office.district}
                <span aria-hidden className="h-px w-5 bg-[#b8861b]" />
                <span className="font-mono">{office.pincode || "No pincode"}</span>
              </p>
              {office.distanceKm !== null ? (
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {formatDistance(office.distanceKm)} away
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close post office details"
            className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full bg-sand"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="mt-3">
          <StatusBadge status={office.status} />
        </div>

        {visit ? (
          <div className="mt-4 rounded-2xl bg-visited-soft p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 animate-thump place-items-center rounded-full bg-visited text-white outline-2 outline-offset-1 outline-visited">
                <CheckIcon className="size-5" strokeWidth={3} />
              </span>
              <div className="flex-1">
                <p className="text-base font-bold text-visited-ink">
                  Stamped in your passport
                </p>
                <p className="flex items-center gap-1 text-sm text-visited-ink">
                  Visited {visit.visitedAt} ·{" "}
                  {visit.isPublic ? (
                    <GlobeIcon className="size-3.5" />
                  ) : (
                    <LockIcon className="size-3.5" />
                  )}
                  {visit.isPublic ? "Public" : "Private"}
                </p>
              </div>
            </div>
            {visit.note ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-5">{visit.note}</p>
            ) : null}
          </div>
        ) : null}

        {!visit ? (
          <ProximityBanner km={office.distanceKm} onCheckDistance={onCheckDistance} />
        ) : null}

        <dl className="mt-4 rounded-2xl border border-line bg-paper px-4 py-1 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Pincode</dt>
            <dd className="font-semibold">{office.pincode || "Not listed"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line py-2.5">
            <dt className="text-muted">District</dt>
            <dd className="font-semibold">{office.district}</dd>
          </div>
        </dl>
      </div>

      <div className="shrink-0 border-t border-line px-5 pb-5 pt-3">
        {visit ? (
          <>
            <button
              type="button"
              onClick={() => onEditVisit(office.id)}
              className="min-h-13 w-full rounded-full bg-ink text-base font-bold text-white"
            >
              {visit.note || visit.photoPath ? "Edit note and photo" : "Add note and photo"}
            </button>
            <div className="mt-2.5 flex gap-2.5">
              {hasCoordinates(office) ? (
                <DirectionsLink office={office} />
              ) : null}
              <button
                type="button"
                onClick={() => void removeVisit(office.id)}
                className={`${SECONDARY_BUTTON} text-postal-dark`}
              >
                Remove visit
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onMarkVisited(office.id)}
              className="min-h-[62px] w-full rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold text-white"
            >
              <CheckIcon className="mr-1.5 inline size-5" strokeWidth={3} />
              Stamp it
            </button>
            <div className="mt-3 flex items-start justify-center gap-6">
              <button
                type="button"
                onClick={() => togglePlanned(office.id)}
                aria-pressed={isPlanned}
                className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                <span className="kp-glass grid size-12 place-items-center rounded-full text-[#2f4aa8]">
                  <FlagIcon className="size-5" />
                </span>
                {isPlanned ? "Planned" : "Plan"}
              </button>
              {hasCoordinates(office) ? (
                <a
                  href={directionsUrl({ lat: office.lat, lng: office.lng })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  <span className="kp-glass grid size-12 place-items-center rounded-full text-ink">
                    <NavigationIcon className="size-5" />
                  </span>
                  Route
                </a>
              ) : null}
            </div>
          </>
        )}
      </div>
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
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-sand text-sm font-semibold text-ink"
      >
        <TargetIcon className="size-4" />
        Check if you&apos;re here
      </button>
    ) : null;
  }
  if (state === "here") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-visited-soft p-3 text-sm font-semibold text-visited-ink">
        <CheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
        You&apos;re here · {formatShortDistance(km)} away. Ask for the postmark, then stamp it.
      </p>
    );
  }
  return (
    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-sm text-warn">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        <b>You&apos;re {formatDistance(km)} away.</b> Stamps are meant to be collected in
        person. You can still log a past visit.
      </span>
    </p>
  );
}

function DirectionsLink({ office }: { office: OfficeWithStatus & { lat: number; lng: number } }) {
  return (
    <a
      href={directionsUrl({ lat: office.lat, lng: office.lng })}
      target="_blank"
      rel="noopener noreferrer"
      className={SECONDARY_BUTTON}
    >
      <NavigationIcon className="size-4" />
      Directions
    </a>
  );
}
