"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ExploreView } from "@/components/explore/ExploreView";
import type { PostOffice } from "@/types";

/**
 * The map screen, mounted once and kept alive by the app frame while people visit other tabs.
 * `?office=` links (from the passport, say) move the existing screen to that office instead of
 * rebuilding it. `?district=` (from the passport's "by district" list) filters the list down to
 * that one district instead.
 */
export function ExploreHost({ offices }: { offices: PostOffice[] }) {
  const searchParams = useSearchParams();
  const requested = Number(searchParams.get("office"));
  const requestedDistrict = searchParams.get("district");
  const active = usePathname() === "/explore";
  return (
    <ExploreView
      offices={offices}
      active={active}
      initialSelectedId={
        Number.isInteger(requested) && requested > 0 ? requested : null
      }
      initialDistrict={requestedDistrict}
    />
  );
}
