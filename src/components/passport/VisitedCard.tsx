"use client";

import Link from "next/link";
import { StampThumb } from "@/components/office/StampThumb";
import { CameraIcon, GlobeIcon, LockIcon } from "@/components/ui/icons";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import type { PostOffice, Visit } from "@/types";

interface VisitedCardProps {
  office: PostOffice;
  visit: Visit;
  onEdit: (officeId: number) => void;
}

export function VisitedCard({ office, visit, onEdit }: VisitedCardProps) {
  const photoUrl = usePhotoUrl(visit.photoPath);

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <StampThumb path={office.stampImagePath} status="visited" className="size-12" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{office.name}</h3>
          <p className="text-sm text-muted">
            {office.district} · <span className="whitespace-nowrap">{visit.visitedAt}</span>
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-[10px] bg-sand px-2 py-1 text-xs font-semibold text-muted">
          {visit.isPublic ? (
            <GlobeIcon className="size-3" />
          ) : (
            <LockIcon className="size-3" />
          )}
          {visit.isPublic ? "Public" : "Private"}
        </span>
      </div>

      {visit.note ? (
        <p className="mt-2.5 whitespace-pre-line text-sm leading-5">{visit.note}</p>
      ) : null}

      {visit.photoPath ? (
        <div className="mt-3">
          {photoUrl ? (
            // Signed URLs cannot go through next/image, so a plain img is correct here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`Your stamp at ${office.name}`}
              className="h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="grid h-40 w-full place-items-center rounded-xl bg-sand text-muted">
              <CameraIcon className="size-6" />
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <Link
          href={`/explore?office=${office.id}`}
          className="flex min-h-11 items-center text-sm font-semibold text-focus"
        >
          View on map
        </Link>
        <button
          type="button"
          onClick={() => onEdit(office.id)}
          className="min-h-11 px-3.5 text-sm font-semibold text-focus"
        >
          Edit
        </button>
      </div>
    </li>
  );
}
