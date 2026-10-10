"use client";

import { useMemo, useState } from "react";
import { FilterChips, type StatusFilter } from "@/components/explore/FilterChips";
import { OfficeList } from "@/components/explore/OfficeList";
import { LazyOfficeMap } from "@/components/map/LazyOfficeMap";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import { VisitDialog } from "@/components/office/VisitDialog";
import { useToast } from "@/components/providers/ToastProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { LocateIcon, SearchIcon } from "@/components/ui/icons";
import { sortByDistance, withStatus } from "@/lib/office-status";
import type { Coordinates, PostOffice } from "@/types";

interface ExploreViewProps {
  offices: PostOffice[];
  /** Office to open on load, e.g. when linked from the passport page. */
  initialSelectedId: number | null;
}

export function ExploreView({ offices, initialSelectedId }: ExploreViewProps) {
  const { visits, plannedIds, markVisited } = useVisits();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const allOffices = useMemo(
    () => withStatus(offices, visits, plannedIds, userLocation),
    [offices, visits, plannedIds, userLocation],
  );

  const visibleOffices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = allOffices.filter((office) => {
      if (filter !== "all" && office.status !== filter) return false;
      if (!needle) return true;
      return (
        office.name.toLowerCase().includes(needle) ||
        office.district.toLowerCase().includes(needle) ||
        office.pincode.includes(needle)
      );
    });
    return userLocation ? sortByDistance(matches) : matches;
  }, [allOffices, filter, query, userLocation]);

  // The detail card follows the filter and search: it closes by itself when the
  // selected post office drops out of the visible list.
  const selectedOffice = visibleOffices.find((office) => office.id === selectedId) ?? null;
  const editingOffice = offices.find((office) => office.id === editingId) ?? null;

  async function handleMarkVisited(officeId: number) {
    const saved = await markVisited(officeId);
    if (!saved) return;
    showToast({
      message: "Marked as visited",
      actionLabel: "Add photo or note",
      onAction: () => setEditingId(officeId),
    });
  }

  function handleFindNearMe() {
    if (!navigator.geolocation) {
      showToast({ message: "Your browser does not support location." });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        showToast({ message: "Could not get your location. Check your browser permissions." });
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col-reverse md:flex-row">
      <aside
        aria-label="Post offices"
        className="flex h-[44%] min-h-0 flex-col border-t border-line bg-white md:h-auto md:w-[26rem] md:shrink-0 md:border-r md:border-t-0"
      >
        <div className="shrink-0 space-y-1 px-4 pt-4">
          <div className="relative">
            <label htmlFor="office-search" className="sr-only">
              Search by post office, district or pincode
            </label>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" />
            <input
              id="office-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search post office, district or pincode"
              className="h-12 w-full rounded-xl border border-line-strong bg-paper pl-11 pr-3 text-base"
            />
          </div>
          <FilterChips value={filter} onChange={setFilter} />
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm text-muted" aria-live="polite">
              {visibleOffices.length} of {offices.length} post offices
              {userLocation ? " · nearest first" : ""}
            </p>
            <button
              type="button"
              onClick={handleFindNearMe}
              disabled={isLocating}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-focus disabled:opacity-60"
            >
              <LocateIcon className="size-4" />
              {isLocating ? "Locating…" : "Near me"}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OfficeList
            offices={visibleOffices}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </aside>

      <section aria-label="Map" className="relative isolate min-h-0 flex-1">
        <LazyOfficeMap
          offices={visibleOffices}
          selectedId={selectedId}
          userLocation={userLocation}
          onSelect={setSelectedId}
        />
        {selectedOffice ? (
          <OfficeDetail
            key={selectedOffice.id}
            office={selectedOffice}
            onClose={() => setSelectedId(null)}
            onMarkVisited={handleMarkVisited}
            onEditVisit={setEditingId}
          />
        ) : null}
      </section>

      <VisitDialog office={editingOffice} onClose={() => setEditingId(null)} />
    </div>
  );
}
