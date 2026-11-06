"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExploreControls } from "@/components/explore/ExploreControls";
import type { StatusFilter } from "@/components/explore/FilterChips";
import { LocationSheet } from "@/components/explore/LocationSheet";
import { OfficeList } from "@/components/explore/OfficeList";
import { ProgressStrip } from "@/components/explore/ProgressStrip";
import { LazyOfficeMap } from "@/components/map/LazyOfficeMap";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import { StampedSheet } from "@/components/office/StampedSheet";
import { VisitDialog } from "@/components/office/VisitDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useStateOffices } from "@/components/providers/StateProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { StateSwitcher } from "@/components/ui/StateSwitcher";
import { LocateIcon } from "@/components/ui/icons";
import { LOCATION_PRIMED_KEY } from "@/lib/constants";
import { isNativeApp } from "@/lib/native";
import { readJson, writeJson } from "@/lib/local-storage";
import { sortByDistance, withStatus } from "@/lib/office-status";
import { getFirstName } from "@/lib/user-display";
import type { Coordinates, PostOffice } from "@/types";

interface ExploreViewProps {
  offices: PostOffice[];
  /** Office to open on load, e.g. when linked from the passport page. */
  initialSelectedId: number | null;
  /** False while another tab is showing; the screen stays mounted but out of sight. */
  active?: boolean;
}

export function ExploreView({
  offices: indiaOffices,
  initialSelectedId,
  active = true,
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

  // Phone list sheet: 0 = peek, 1 = half, 2 = nearly full. While a finger is dragging, dragHeight (px) wins.
  const [snap, setSnap] = useState<0 | 1 | 2>(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetOpen = snap > 0;
  // Each time the map tab is opened, start with the map in view and the list tucked away.
  useEffect(() => {
    // Arriving on the tab is an event from outside this screen, so resetting here is the point of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active) setSnap(0);
  }, [active]);
  const setSheetOpen = (open: boolean) => setSnap(open ? 1 : 0);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(
    initialSelectedId
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [stampedId, setStampedId] = useState<number | null>(null);
  const [locationSheet, setLocationSheet] = useState<"prime" | "denied" | null>(null);

  // On phones the list sheet waits for the map, so opening this screen shows the map first and the
  // sheet then fades in over it. If the map is slow or fails to start, show the list after a moment anyway.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMapReady(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  // A link to one office (for example from the passport) opens that office's state.
  // The screen stays mounted between visits, so this also runs for each later link.
  useEffect(() => {
    const linked = indiaOffices.find((office) => office.id === initialSelectedId);
    if (!linked) return;
    choose(linked.state);
    // A link is an event from outside this screen, so reacting to it here is the point of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(linked.id);
    // Only when the link changes; later choices belong to the person.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedId]);

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
    setStampedId(officeId);
  }

  function handleFindNearMe() {
    // Explain first, once, so the system prompt is never a surprise.
    if (!readJson<boolean>(LOCATION_PRIMED_KEY, false)) {
      setLocationSheet("prime");
      return;
    }
    requestLocation();
  }

  // If location was already allowed, check the distance quietly when an office is opened.
  useEffect(() => {
    if (selectedId === null || userLocation !== null) return;
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (cancelled || status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (!cancelled) setUserLocation({ lat: coords.latitude, lng: coords.longitude });
          },
          () => undefined,
          { enableHighAccuracy: false, timeout: 10_000 }
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [selectedId, userLocation]);

  function requestLocation() {
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
        setLocationSheet("denied");
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }

  const sheetRef = useRef<HTMLElement>(null);
  const sheetStyle = {
    height:
      dragHeight ??
      (snap === 0 ? "7.75rem" : snap === 1 ? "50%" : "calc(100% - 7.5rem)"),
  };
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  const dragProps = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      drag.current = { y: event.clientY, h: sheet.offsetHeight, moved: false };
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const state = drag.current;
      const sheet = sheetRef.current;
      if (!state || !sheet) return;
      const dy = state.y - event.clientY;
      if (!state.moved && Math.abs(dy) < 8) return;
      if (!state.moved) {
        state.moved = true;
        // Only start owning the pointer once it is clearly a drag, so taps on buttons still land.
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const parent = sheet.parentElement?.clientHeight ?? 0;
      setDragHeight(Math.min(Math.max(state.h + dy, 124), Math.max(parent - 120, 124)));
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => finishDrag(event.clientY),
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => finishDrag(event.clientY),
  };
  function finishDrag(clientY: number) {
    const state = drag.current;
    const sheet = sheetRef.current;
    drag.current = null;
    if (!state?.moved || !sheet) return;
    const parent = sheet.parentElement?.clientHeight ?? 0;
    const stops = [124, parent * 0.5, Math.max(parent - 120, 124)];
    // A flick counts: lean the landing spot the way the finger was heading.
    const flick = (state.y - clientY) * 1.5;
    const target = Math.min(Math.max(state.h + flick, 124), stops[2]);
    const nearest = stops.reduce(
      (best, stop, index) =>
        Math.abs(stop - target) < Math.abs(stops[best] - target) ? index : best,
      0
    );
    setSnap(nearest as 0 | 1 | 2);
    setDragHeight(null);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col md:flex-row">
      <aside
        ref={sheetRef}
        aria-label="Post offices"
        style={sheetStyle}
        className={`absolute inset-x-0 bottom-0 z-[1050] flex min-h-0 flex-col kp-glass-panel rounded-t-3xl md:bg-white md:shadow-none md:h-auto! md:static md:z-auto md:h-auto md:w-[26rem] md:shrink-0 md:rounded-none md:border-r md:border-t-0 md:shadow-none ${
          ""
        } ${
          dragHeight === null ? "transition-[height,opacity] duration-300 ease-out" : ""
        } ${selectedOffice ? "max-md:hidden" : ""} ${
          mapReady ? "" : "max-md:pointer-events-none max-md:opacity-0"
        }`}
      >
        <div className="shrink-0 touch-none md:touch-auto" {...dragProps}>
        <SheetHandle open={sheetOpen} onChange={setSheetOpen} />
        <div className="space-y-1 px-4 md:pt-4">
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
            <NearMeButton onClick={handleFindNearMe} isLocating={isLocating} tourId="near-me" />
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
          onReady={() => setMapReady(true)}
        />
        {selectedOffice ? (
          <OfficeDetail
            key={selectedOffice.id}
            office={selectedOffice}
            onClose={() => setSelectedId(null)}
            onMarkVisited={handleMarkVisited}
            onEditVisit={setEditingId}
            onCheckDistance={handleFindNearMe}
          />
        ) : null}
      </section>

      <StampedSheet
        office={allOffices.find((office) => office.id === stampedId) ?? null}
        collected={allOffices.filter((office) => office.status === "visited").length}
        total={allOffices.length}
        onClose={() => setStampedId(null)}
        onAddNote={setEditingId}
      />
      <LocationSheet
        mode={locationSheet}
        native={isNativeApp()}
        onClose={() => setLocationSheet(null)}
        onContinue={() => {
          writeJson(LOCATION_PRIMED_KEY, true);
          setLocationSheet(null);
          requestLocation();
        }}
      />
      <VisitDialog office={editingOffice} onClose={() => setEditingId(null)} />
    </div>
  );
}

/** The grab bar of the phone list sheet: tap to toggle. Dragging is handled by the whole header. */
function SheetHandle({
  open,
  onChange,
}: {
  open: boolean;
  onChange: (open: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Collapse the list" : "Expand the list"}
      aria-expanded={open}
      onClick={() => onChange(!open)}
      data-tour="sheet"
      className="grid h-9 w-full shrink-0 place-items-center md:hidden"
    >
      <span className="h-1.5 w-11 rounded-full bg-line-strong" />
    </button>
  );
}

function NearMeButton({
  onClick,
  isLocating,
  className = "",
  tourId,
}: {
  onClick: () => void;
  isLocating: boolean;
  className?: string;
  tourId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocating}
      data-tour={tourId}
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-postal disabled:opacity-60 ${className}`}
    >
      <LocateIcon className="size-4" />
      {isLocating ? "Locating…" : "Near me"}
    </button>
  );
}
