"use client";

import Link from "next/link";
import { Postmark } from "@/components/office/Postmark";
import { useVisits } from "@/components/providers/VisitsProvider";
import { formatVisitDate } from "@/lib/date";
import { Sheet } from "@/components/ui/Sheet";
import type { PostOffice, Visit } from "@/types";

interface StampDetailSheetProps {
  office: PostOffice | null;
  visit: Visit | undefined;
  onClose: () => void;
  /** Opens the note and photo editor for this stamp. */
  onEdit?: (officeId: number) => void;
}

/** One stamp, large, with when it was collected. */
export function StampDetailSheet({
  office,
  visit,
  onClose,
  onEdit,
}: StampDetailSheetProps) {
  const { removeVisit } = useVisits();
  return (
    <Sheet
      open={office !== null && visit !== undefined}
      onClose={onClose}
      title={office?.name ?? "Stamp"}
    >
      {office && visit ? (
        <div className="text-center">
          <Postmark
            name={office.name}
            date={formatVisitDate(visit.visitedAt)}
            pincode={office.pincode}
            className="mx-auto size-40"
          />
          <p className="mt-4 text-base font-semibold">
            {office.district} district · {office.pincode}
          </p>
          <p className="mt-1 text-sm text-muted">
            Collected {formatVisitDate(visit.visitedAt)}
          </p>
          {visit.note ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-5">
              {visit.note}
            </p>
          ) : null}
          <div className="mt-5 flex gap-3">
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(office.id);
                }}
                className="min-h-12 flex-1 rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-sm font-bold uppercase tracking-[0.1em] text-white"
              >
                {visit.note || visit.photoPath ? "Edit note" : "Add note"}
              </button>
            ) : null}
            <Link
              href={`/explore?office=${office.id}`}
              className="kp-glass flex min-h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold"
            >
              View on map
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              void removeVisit(office.id);
              onClose();
            }}
            className="mx-auto mt-2 flex min-h-11 items-center px-3 text-xs font-semibold text-postal-dark"
          >
            Remove visit
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
