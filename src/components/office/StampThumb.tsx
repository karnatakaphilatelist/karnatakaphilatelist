"use client";

import { useState } from "react";
import { MailIcon } from "@/components/ui/icons";
import { stampImageUrl } from "@/lib/stamp-image";
import type { OfficeStatus } from "@/types";

interface StampThumbProps {
  /** The post office's `stampImagePath`. */
  path: string | null;
  status: OfficeStatus;
  /**
   * Tailwind size classes for the container, e.g. "size-[52px]".
   * Defaults to a fixed square for use in list cards.
   */
  className?: string;
  /**
   * When true the container shrinks to the image's natural dimensions
   * instead of being a fixed square. Use this in contexts where each stamp
   * should show at its own aspect ratio (e.g. the OfficeDetail hero).
   */
  natural?: boolean;
}

/**
 * The post office's official PPC stamp image. Always shown in full colour —
 * the green verified badge on the card is the visited indicator instead.
 * Falls back to a mail icon placeholder when there is no stamp yet or the
 * image fails to load.
 */
export function StampThumb({
  path,
  status,
  className = "size-[52px]",
  natural = false,
}: StampThumbProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : stampImageUrl(path);

  if (natural) {
    // Natural-size mode: let the image drive the dimensions.
    // The container only provides the rounded corners, background and border styling.
    return (
      <span
        aria-hidden="true"
        className={`block shrink-0 overflow-hidden rounded-xl bg-sand text-muted ${className}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="block max-h-[180px] max-w-[160px] p-1"
          />
        ) : (
          <span className="flex size-[52px] items-center justify-center">
            <MailIcon className="size-1/2" />
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-sand text-muted ${className}`}
    >
      {url ? (
        // Public bucket assets are already sized; a plain img avoids image-loader config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-contain p-1"
        />
      ) : (
        <MailIcon className="size-1/2" />
      )}
    </span>
  );
}
