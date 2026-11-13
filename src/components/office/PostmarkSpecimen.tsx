"use client";

import { useState } from "react";
import { stampImageUrl } from "@/lib/stamp-image";

interface PostmarkSpecimenProps {
  /** The office's `stampImagePath`. */
  path: string;
  /** Full colour once visited; a greyed-out preview of what to look for until then. */
  visited: boolean;
  name: string;
}

/**
 * The office's real postmark, scanned from the printed Philately Passport, shown
 * as a small specimen card beside "About this place" — so people can see what
 * to look for before they visit, and what they actually got once they have.
 * Renders nothing when the office has no scanned postmark yet.
 */
export function PostmarkSpecimen({ path, visited, name }: PostmarkSpecimenProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : stampImageUrl(path);
  if (!url) return null;

  return (
    <figure className="flex shrink-0 flex-col items-center gap-1">
      <div className="grid size-[72px] -rotate-2 place-items-center rounded-xl border border-ink/10 bg-white p-1.5 shadow-[0_3px_8px_-3px_rgb(22_32_79/0.25)]">
        {/* Public bucket assets are already sized; a plain img avoids image-loader config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${name} postmark design`}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`size-full object-contain ${
            visited ? "" : "opacity-70 grayscale"
          }`}
        />
      </div>
      <figcaption className="text-[9px] font-semibold uppercase leading-3 tracking-[0.1em] text-muted">
        Postmark
      </figcaption>
    </figure>
  );
}
