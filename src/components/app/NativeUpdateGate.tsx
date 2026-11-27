"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/components/providers/ToastProvider";

/** After this many days of an update waiting, Google Play's full-screen update replaces the gentle one. */
const FORCE_AFTER_DAYS = 7;
/** Priority 4 or 5 set on a Play release means "everyone must update now". */
const FORCE_PRIORITY = 4;
/** Don't ask Play again more often than this when the app keeps coming to the front. */
const CHECK_GAP_MS = 30 * 60 * 1000;

/**
 * Keeps the Android app current through Google Play's own in-app updates.
 * Normally the update downloads in the background and a toast offers a restart.
 * If a release is marked high priority in Play Console, or has waited a week,
 * Play's blocking update screen is used instead, so nobody stays on an old build.
 * Does nothing in a browser, on iOS, or on builds installed outside Play.
 */
export function NativeUpdateGate() {
  const { showToast } = useToast();

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let cancelled = false;
    let lastCheck = 0;
    const cleanups: Array<() => void> = [];

    async function check() {
      const now = Date.now();
      if (now - lastCheck < CHECK_GAP_MS) return;
      lastCheck = now;
      try {
        const { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } =
          await import("@capawesome/capacitor-app-update");
        const info = await AppUpdate.getAppUpdateInfo();
        if (cancelled) return;
        // Already downloaded earlier (for example the app was closed before restarting).
        if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
          await AppUpdate.completeFlexibleUpdate();
          return;
        }
        if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE)
          return;
        const mustUpdate =
          (info.updatePriority ?? 0) >= FORCE_PRIORITY ||
          (info.clientVersionStalenessDays ?? 0) >= FORCE_AFTER_DAYS;
        if (mustUpdate && info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
          return;
        }
        if (!info.flexibleUpdateAllowed) return;
        const handle = await AppUpdate.addListener(
          "onFlexibleUpdateStateChange",
          (state) => {
            if (state.installStatus !== FlexibleUpdateInstallStatus.DOWNLOADED)
              return;
            showToast({
              message: "A new version of Philatrail is ready.",
              actionLabel: "Restart",
              onAction: () => void AppUpdate.completeFlexibleUpdate(),
            });
          }
        );
        cleanups.push(() => void handle.remove());
        await AppUpdate.startFlexibleUpdate();
      } catch {
        // Not installed from Play, offline, or an older app without the update plugin: carry on.
      }
    }

    void check();
    let removeResume: (() => void) | undefined;
    import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void check();
        })
      )
      .then((handle) => {
        if (cancelled) void handle.remove();
        else removeResume = () => void handle.remove();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      removeResume?.();
      cleanups.forEach((fn) => fn());
    };
  }, [showToast]);

  return null;
}
