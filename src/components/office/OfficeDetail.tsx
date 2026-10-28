"use client";

import { StampThumb } from "@/components/office/StampThumb";
import { StatusBadge } from "@/components/office/StatusBadge";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  CheckIcon,
  CloseIcon,
  FlagIcon,
  GlobeIcon,
  LockIcon,
  NavigationIcon,
} from "@/components/ui/icons";
import { directionsUrl, formatDistance } from "@/lib/geo";
import { hasCoordinates } from "@/lib/office-status";
import type { OfficeWithStatus } from "@/types";

interface OfficeDetailProps {
  office: OfficeWithStatus;
  onClose: () => void;
  onMarkVisited: (officeId: number) => void;
  onEditVisit: (officeId: number) => void;
}

const SECONDARY_BUTTON =
  "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-sm border-[1.5px] border-line-strong bg-white text-sm font-semibold";

/**
 * Details and actions for one office. A bottom sheet on phones, a card
 * floating over the map on larger screens.
 */
export function OfficeDetail({
  office,
  onClose,
  onMarkVisited,
  onEditVisit,
}: OfficeDetailProps) {
  const { visits, togglePlanned, removeVisit } = useVisits();
  const visit = visits[office.id];
  const isPlanned = office.status === "planned";

  return (
    <div
      role="region"
      aria-label={`${office.name} details`}
      className="fixed inset-x-0 bottom-0 z-[1100] flex max-h-[85dvh] animate-rise flex-col rounded-t-sm bg-white shadow-[0_-8px_30px_rgb(43_43_43/0.18)] md:absolute md:inset-x-auto md:bottom-auto md:left-14 md:top-4 md:max-h-[calc(100%-2rem)] md:w-96 md:rounded-sm md:shadow-xl"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <StampThumb
              path={office.stampImagePath}
              status={office.status}
              className="size-16"
            />
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">
                {office.name}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {office.district} district
                {office.distanceKm !== null
                  ? ` · ${formatDistance(office.distanceKm)} away`
                  : ""}
              </p>
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
          <div className="mt-4 rounded-sm bg-visited-soft p-3">
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

        <dl className="mt-4 rounded-sm border border-line bg-paper px-4 py-1 text-sm">
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
              className="min-h-13 w-full rounded-sm bg-ink kp-label text-white"
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
              className="min-h-13 w-full rounded-sm bg-postal kp-label text-white"
            >
              Mark as visited
            </button>
            <div className="mt-2.5 flex gap-2.5">
              <button
                type="button"
                onClick={() => togglePlanned(office.id)}
                aria-pressed={isPlanned}
                className={SECONDARY_BUTTON}
              >
                <FlagIcon className="size-4" />
                {isPlanned ? "Planned" : "Plan a visit"}
              </button>
              {hasCoordinates(office) ? (
                <DirectionsLink office={office} />
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
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
