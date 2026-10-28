"use client";

import { useState } from "react";
import { MailIcon } from "@/components/ui/icons";
import { stampImageUrl } from "@/lib/stamp-image";
import type { OfficeStatus } from "@/types";

interface StampThumbProps {
  /** The post office's `stampImagePath`. */
  path: string | null;
  status: OfficeStatus;
  /** Tailwind size classes, e.g. "size-[52px]". */
  className?: string;
}

/**
 * The post office's official stamp as its icon. It is greyscale until the post
 * office is visited, then full colour. Falls back to a mail icon when there is
 * no stamp yet or the image fails to load.
 */
export function StampThumb({ path, status, className = "size-[52px]" }: StampThumbProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : stampImageUrl(path);

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-sm bg-sand text-muted ${className}`}
    >
      {url ? (
        // Public bucket assets are already sized; a plain img avoids image-loader config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={`size-full object-contain p-1 ${
            status === "visited" ? "" : "opacity-80 grayscale"
          }`}
        />
      ) : (
        <MailIcon className="size-1/2" />
      )}
    </span>
  );
}
