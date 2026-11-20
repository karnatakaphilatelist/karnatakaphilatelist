"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { NAV_ITEMS } from "@/components/layout/nav-items";

/** How close to the left edge a swipe has to start to count as "go back". */
const EDGE_ZONE_PX = 24;
/** How far right it has to travel, staying mostly horizontal, to commit. */
const COMMIT_DISTANCE_PX = 80;

const ROOT_PATHS = new Set<string>(NAV_ITEMS.map((item) => item.href));

/**
 * A plain Capacitor WebView has no native "swipe from the left edge to go back" —
 * that's a UINavigationController behavior, and this app is one WebView showing
 * router routes, not a view-controller stack. This re-creates the gesture by hand
 * for every screen reached by drilling into a tab (terms, privacy, settings, an
 * article, …). The four tab roots have nowhere to go back to, so they're left
 * alone — this never competes with the map's own drag/pan gestures on Explore.
 */
export function SwipeBackLayer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const start = useRef<{ x: number; y: number } | null>(null);
  const canGoBack = !ROOT_PATHS.has(pathname);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canGoBack) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.clientX > EDGE_ZONE_PX) return;
    start.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = Math.abs(event.clientY - origin.y);
    if (dx > COMMIT_DISTANCE_PX && dy < dx * 0.5) router.back();
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
      className="h-full"
    >
      {children}
    </div>
  );
}
