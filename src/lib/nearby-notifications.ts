/**
 * Nearby-notification service for Philatrail.
 *
 * Uses @capacitor-community/background-geolocation to continuously watch
 * the user's position in the background (even when the app is closed on
 * Android, or in the background on iOS) and fires a local notification when
 * the user enters the GEOFENCE_RADIUS_M radius of an unvisited post office.
 *
 * The underlying plugin runs a foreground service on Android (visible
 * persistent notification) and uses the iOS "significant location changes"
 * API in the background — accurate enough for 300 m checks without draining
 * the battery like continuous GPS would.
 *
 * This module is a no-op in the browser — it only runs on native platforms.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
  Location as BGLocation,
  CallbackError,
} from "@capacitor-community/background-geolocation";
import type { PostOffice } from "@/types";
import { findNearbyOffice, markNotified } from "@/lib/geofence";

// Register the plugin instance once at module load time.
// On web this resolves to a stub; on native it binds to the real implementation.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

/** Callback type invoked when the user taps a nearby notification. */
export type NearbyNotificationHandler = (officeId: number) => void;

let _tapHandler: NearbyNotificationHandler | null = null;
let _watcherId: string | null = null;
let _initialised = false;

/** Latest snapshot of unvisited offices, updated via setWatchedOffices(). */
let _offices: PostOffice[] = [];
let _visitedIds: Set<number> = new Set();

function isSupported(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Update the set of offices (and visited IDs) that the background watcher
 * checks against.  Safe to call any time — takes effect on the next location
 * update.
 */
export function setWatchedOffices(
  offices: PostOffice[],
  visitedIds: Set<number>,
): void {
  _offices = offices;
  _visitedIds = visitedIds;
}

/**
 * Request location + notification permissions and start the background watcher.
 *
 * Safe to call more than once — subsequent calls are no-ops if already set up.
 *
 * @param onOfficeTap  Called when the user taps a "you're near X" notification.
 *                     Receives the office ID so the caller can open the detail card.
 */
export async function initNearbyNotifications(
  onOfficeTap?: NearbyNotificationHandler,
): Promise<void> {
  if (!isSupported() || _initialised) return;
  if (onOfficeTap) _tapHandler = onOfficeTap;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // ── 1. Request permissions ───────────────────────────────────────────────

    const notifPerm = await LocalNotifications.requestPermissions();
    if (notifPerm.display !== "granted") {
      console.info("[nearby] notification permission not granted — alerts disabled");
      return;
    }

    // ── 2. Create Android notification channel ───────────────────────────────

    await LocalNotifications.createChannel({
      id: "nearby",
      name: "Nearby post offices",
      description: "Alerts when you are near a stamp post office",
      importance: 4, // HIGH
      visibility: 1,
      sound: "default",
      vibration: true,
    });

    // ── 3. Handle notification tap ───────────────────────────────────────────

    await LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action) => {
        const extra = action.notification.extra as
          | { officeId?: number }
          | undefined;
        const officeId = extra?.officeId;
        if (officeId && _tapHandler) {
          _tapHandler(officeId);
        }
      },
    );

    // ── 4. Start background location watcher ────────────────────────────────

    _watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage:
          "Philatrail is checking for nearby stamp post offices.",
        backgroundTitle: "Looking for stamp stops…",
        requestPermissions: true,
        // Only wake up for meaningful movement; reduces battery use.
        distanceFilter: 50,
      },
      async (position?: BGLocation, error?: CallbackError) => {
        if (error || !position) return;

        const nearby = findNearbyOffice(
          position.latitude,
          position.longitude,
          _offices,
          _visitedIds,
        );
        if (!nearby) return;

        // Mark notified BEFORE scheduling so a rapid second callback doesn't
        // fire a duplicate before the first notification is even shown.
        markNotified(nearby.id);

        const notifId = (nearby.id % 2_147_483_647) || 1;
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: notifId,
                title: "Stamp stop nearby 📮",
                body: `${nearby.name} is within 300 m — tap to view.`,
                channelId: "nearby",
                extra: { officeId: nearby.id },
                smallIcon: "ic_stat_stamp",
                iconColor: "#CF1830",
              },
            ],
          });
        } catch (schedErr) {
          console.warn("[nearby] failed to schedule notification:", schedErr);
        }
      },
    );

    _initialised = true;
    console.info("[nearby] background location watcher started:", _watcherId);
  } catch (err) {
    console.warn("[nearby] initNearbyNotifications failed:", err);
  }
}

/**
 * Stop the background watcher and remove all listeners.
 * Call on sign-out or when the user disables notifications.
 */
export async function stopNearbyNotifications(): Promise<void> {
  if (!isSupported() || !_initialised) return;
  try {
    if (_watcherId) {
      await BackgroundGeolocation.removeWatcher({ id: _watcherId });
      _watcherId = null;
    }
    _initialised = false;
  } catch (err) {
    console.warn("[nearby] stopNearbyNotifications failed:", err);
  }
}

/**
 * Update the tap handler (useful when the UI that handles taps re-mounts
 * without the whole init flow needing to re-run).
 */
export function setNearbyNotificationHandler(
  handler: NearbyNotificationHandler,
): void {
  _tapHandler = handler;
}
