"use client";

import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { formatVisitDate } from "@/lib/date";
import type { PublicVisitNote } from "@/lib/visits/remote-store";

/** One public note: Google-Maps-review style — avatar, name, date, text, optional photo. */
export function PublicNoteRow({ note }: { note: PublicVisitNote }) {
  const photoUrl = usePhotoUrl(note.photoPath);
  const name = note.author?.fullName?.trim() || "A collector";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex gap-3 border-b border-ink/[0.06] py-3.5 last:border-b-0">
      {note.author?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
        <img
          src={note.author.avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-postal-soft text-sm font-bold text-postal">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[13px] font-semibold">{name}</p>
          <p className="shrink-0 text-[12px] text-muted">
            {formatVisitDate(note.visitedAt)}
          </p>
        </div>
        <p className="mt-1 whitespace-pre-line text-sm leading-[21px]">
          {note.note}
        </p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
          <img
            src={photoUrl}
            alt=""
            className="mt-2 h-32 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
