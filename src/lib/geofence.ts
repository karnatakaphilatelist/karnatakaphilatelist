/**
 * Geofence state management for Philatrail.
 *
 * Tracks which offices are "active" for proximity checking and stores
 * per-office "last notified" timestamps so we don't spam the user.
 *
 * The actual location watching and notification firing is handled by
 * nearby-notifications.ts using @capacitor-community/background-geolocation.
 *
 * This module only runs on native platforms — it is a no-op in the browser.
 */

import type { PostOffice } from "@/types";

/** Radius (metres) within which we fire a "you're near X" alert. */
export const GEOFENCE_RADIUS_M = 300;

/**
 * Minimum time (ms) between repeat notifications for the same office.
 * We re-notify after 24 hours so a user who walks past the same office
 * on different days still gets an alert.
 */
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** localStorage key → Record<officeId, lastNotifiedTimestamp> */
const NOTIFIED_KEY = "pt_notified";

function loadNotified(): Record<number, number> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? (JSON.parse(raw) as Record<number, number>) : {};
  } catch {
    return {};
  }
}

function saveNotified(map: Record<number, number>): void {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {
    // Best-effort.
  }
}

/**
 * Haversine great-circle distance between two lat/lng points, in metres.
 */
export function distanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Given the user's current position and the list of unvisited offices,
 * returns the first office within GEOFENCE_RADIUS_M that hasn't been
 * recently notified — or null if none qualify.
 *
 * Call this inside the background location callback.
 */
export function findNearbyOffice(
  lat: number,
  lng: number,
  offices: PostOffice[],
  visitedIds: Set<number>,
): PostOffice | null {
  const notified = loadNotified();
  const now = Date.now();

  for (const office of offices) {
    if (visitedIds.has(office.id)) continue;
    if (office.lat === null || office.lng === null) continue;
    const dist = distanceM(lat, lng, office.lat, office.lng);
    if (dist > GEOFENCE_RADIUS_M) continue;
    const lastNotified = notified[office.id] ?? 0;
    if (now - lastNotified < COOLDOWN_MS) continue;
    return office;
  }
  return null;
}

/** Mark an office as notified so we respect the cooldown. */
export function markNotified(officeId: number): void {
  const map = loadNotified();
  map[officeId] = Date.now();
  saveNotified(map);
}
