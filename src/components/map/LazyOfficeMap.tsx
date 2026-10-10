"use client";

import dynamic from "next/dynamic";

/**
 * Leaflet touches `window` on import, so the map is loaded in the browser only.
 * The placeholder keeps the layout stable while the map code downloads.
 */
export const LazyOfficeMap = dynamic(
  () => import("@/components/map/OfficeMap").then((module) => module.OfficeMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="grid size-full place-items-center bg-sand text-sm text-muted"
      >
        Loading map…
      </div>
    ),
  },
);
