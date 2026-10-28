"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExploreControls } from "@/components/explore/ExploreControls";
import type { StatusFilter } from "@/components/explore/FilterChips";
import { OfficeList } from "@/components/explore/OfficeList";
import { ProgressStrip } from "@/components/explore/ProgressStrip";
import { LazyOfficeMap } from "@/components/map/LazyOfficeMap";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import { VisitDialog } from "@/components/office/VisitDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useStateOffices } from "@/components/providers/StateProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { StateSwitcher } from "@/components/ui/StateSwitcher";
import { LocateIcon } from "@/components/ui/icons";
import { sortByDistance, withStatus } from "@/lib/office-status";
import { getFirstName } from "@/lib/user-display";
import type { Coordinates, PostOffice } from "@/types";

interface ExploreViewProps {
  offices: PostOffice[];
  /** Office to open on load, e.g. when linked from the passport page. */
  initialSelectedId: number | null;
}

export function ExploreView({
  offices: indiaOffices,
  initialSelectedId,
}: ExploreViewProps) {
  const {
    states,
    stateCode,
    stateOffices: offices,
    choose,
  } = useStateOffices(indiaOffices);
  const { user, isLoading: isAuthLoading, openSignIn } = useAuth();
  const { visits, plannedIds, markVisited, isReady } = useVisits();
  const { showToast } = useToast();

  // A link to one office (for example from the passport) opens that office's state.
  useEffect(() => {
    const linked = indiaOffices.find(
      (office) => office.id === initialSelectedId
    );
    if (linked) choose(linked.state);
    // Only on first load; later choices belong to the person.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(
    initialSelectedId
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const allOffices = useMemo(
    () => withStatus(offices, visits, plannedIds, userLocation),
    [offices, visits, plannedIds, userLocation]
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
  const selectedOffice =
    visibleOffices.find((office) => office.id === selectedId) ?? null;
  // Forget the selection once it is hidden, so clearing the filter or search later
  // does not pop an old card back open. (Setting state while rendering is React's
  // supported way to adjust state that is derived from other state.)
  if (selectedId !== null && selectedOffice === null) setSelectedId(null);
  const editingOffice =
    offices.find((office) => office.id === editingId) ?? null;

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
        showToast({
          message:
            "Could not get your location. Check your browser permissions.",
        });
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col md:flex-row">
      <aside
        aria-label="Post offices"
        className={`absolute inset-x-0 bottom-0 z-[1050] flex min-h-0 flex-col rounded-t-3xl border-t border-line bg-white shadow-[0_-10px_30px_-12px_rgb(28_43_107/0.35)] transition-[height] duration-300 ease-out md:static md:z-auto md:h-auto md:w-[26rem] md:shrink-0 md:rounded-none md:border-r md:border-t-0 md:shadow-none ${
          sheetOpen ? "h-[64%]" : "h-[7.75rem]"
        } ${selectedOffice ? "max-md:hidden" : ""}`}
      >
        <SheetHandle open={sheetOpen} onChange={setSheetOpen} />
        <div className="shrink-0 space-y-1 px-4 md:pt-4">
          {/* On phones the controls live over the map instead, so the detail sheet never covers them. */}
          <div className="hidden space-y-1 md:block">
            <StateSwitcher
              states={states}
              value={stateCode}
              onChange={choose}
              idSuffix="desktop"
            />
            <ExploreControls
              idSuffix="desktop"
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
          {isReady ? (
            <div className={sheetOpen ? "" : "max-md:hidden"}>
              <ProgressStrip
                signedIn={isAuthLoading ? null : user !== null}
                firstName={user ? getFirstName(user) : null}
                stamped={offices.filter((office) => visits[office.id]).length}
                total={offices.length}
                onFindNext={() => setFilter("unvisited")}
                onSignIn={() => openSignIn("manual")}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-1 pb-1 md:hidden">
            <div className="min-w-0 flex-1">
              <StateSwitcher
                states={states}
                value={stateCode}
                onChange={choose}
                idSuffix="mobile"
              />
            </div>
            <NearMeButton onClick={handleFindNearMe} isLocating={isLocating} />
          </div>
          <div className="flex items-center justify-between pb-1.5 md:pb-2">
            <p className="text-sm text-muted" aria-live="polite">
              {visibleOffices.length} of {offices.length} post offices
              {userLocation ? " · nearest first" : ""}
            </p>
            <NearMeButton
              onClick={handleFindNearMe}
              isLocating={isLocating}
              className="max-md:hidden"
            />
          </div>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            sheetOpen ? "" : "max-md:overflow-hidden"
          }`}
        >
          <OfficeList
            offices={visibleOffices}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </aside>

      <section
        aria-label="Map"
        className="absolute inset-0 isolate md:relative md:inset-auto md:min-h-0 md:flex-1"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] space-y-1 px-3 pt-3 md:hidden">
          <div className="pointer-events-auto space-y-1 [&_input]:shadow-md">
            <ExploreControls
              idSuffix="mobile"
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        </div>
        <LazyOfficeMap
          key={stateCode}
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

/** The grab bar of the phone list sheet: tap to toggle, or drag up or down. */
function SheetHandle({
  open,
  onChange,
}: {
  open: boolean;
  onChange: (open: boolean) => void;
}) {
  const startY = useRef<number | null>(null);
  return (
    <button
      type="button"
      aria-label={open ? "Collapse the list" : "Expand the list"}
      aria-expanded={open}
      onPointerDown={(event) => {
        startY.current = event.clientY;
      }}
      onPointerUp={(event) => {
        const dy = startY.current === null ? 0 : event.clientY - startY.current;
        startY.current = null;
        if (dy < -24) onChange(true);
        else if (dy > 24) onChange(false);
        else onChange(!open);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") event.preventDefault();
        if (event.key === "Enter" || event.key === " ") onChange(!open);
      }}
      className="grid h-7 w-full shrink-0 touch-none place-items-center md:hidden"
    >
      <span className="h-1.5 w-11 rounded-full bg-line-strong" />
    </button>
  );
}

function NearMeButton({
  onClick,
  isLocating,
  className = "",
}: {
  onClick: () => void;
  isLocating: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocating}
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-postal disabled:opacity-60 ${className}`}
    >
      <LocateIcon className="size-4" />
      {isLocating ? "Locating…" : "Near me"}
    </button>
  );
}
