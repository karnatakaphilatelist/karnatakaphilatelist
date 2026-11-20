"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { CoachTour } from "@/components/layout/CoachTour";
import { AppHeader } from "@/components/layout/AppHeader";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { TabBar } from "@/components/layout/TabBar";
import { SwipeBackLayer } from "@/components/layout/SwipeBackLayer";
import { isNativeApp } from "@/lib/native";

function ExploreSkeleton() {
  return (
    <div role="status" className="h-full space-y-3 p-4 text-muted">
      <div className="h-13 animate-pulse rounded-full bg-sand" />
      <div className="h-[55%] animate-pulse rounded-2xl bg-sand" />
      <p className="text-center text-sm">Loading post offices…</p>
    </div>
  );
}

/**
 * Page frame: top bar, scrolling content area, and a bottom tab bar on phones.
 *
 * The map screen (`explore`) is mounted the first time it is opened and then only hidden, so coming
 * back to it is instant: no map rebuild, no tile reload, and filters and selection stay as they were.
 */
export function AppShell({
  children,
  explore,
}: {
  children: ReactNode;
  explore: ReactNode;
}) {
  const pathname = usePathname();
  const onExplore = pathname === "/explore";
  const [exploreOpened, setExploreOpened] = useState(onExplore);
  // Adjusting state while rendering is React's supported way to react to a route change.
  if (onExplore && !exploreOpened) setExploreOpened(true);

  // Add `native-app` to <body> so the CSS disables text-selection and long-press menus inside the app.
  // Also dismiss the splash screen once the shell is mounted and the first paint is done —
  // launchAutoHide is false so we control exactly when it goes away, preventing the flash
  // of the web homepage before the app intro screen appears.
  useEffect(() => {
    if (!isNativeApp()) return;
    document.body.classList.add("native-app");

    // rAF ensures the browser has actually painted before we hide the splash.
    requestAnimationFrame(() => {
      import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 200 }))
        .catch(() => undefined);
    });

    return () => document.body.classList.remove("native-app");
  }, []);

  // Register the service worker for offline support in the native app.
  // We only do this in the app (not on the public web) so the SW does not
  // interfere with normal browser caching and ISR on the Next.js side.
  useEffect(() => {
    if (!isNativeApp()) return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => undefined); // Best-effort — the app works without it.
  }, []);

  // People often land on another tab first (the passport, say) and tap through to the map.
  // Download the map code quietly while they look around, so it is ready the moment they arrive.
  useEffect(() => {
    if (onExplore) return;
    const warm = () =>
      void import("@/components/map/OfficeMap").catch(() => undefined);
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(warm, 1500);
    return () => clearTimeout(timer);
  }, [onExplore]);

  return (
    // Pinned to the screen edges instead of sized with dvh: some iPhone web views measure dvh too short, which left a
    // blank band under the tab bar.
    <div className="fixed inset-0 flex flex-col">
      <AppHeader />
      <OfflineBanner />
      <main className="min-h-0 flex-1">
        {exploreOpened ? (
          <div hidden={!onExplore} className="size-full">
            <Suspense fallback={<ExploreSkeleton />}>{explore}</Suspense>
          </div>
        ) : null}
        <SwipeBackLayer>{children}</SwipeBackLayer>
      </main>
      <TabBar />
      <CoachTour />
    </div>
  );
}
