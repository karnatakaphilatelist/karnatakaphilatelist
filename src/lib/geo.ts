import type { Coordinates } from "@/types";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Link that opens turn-by-turn directions in Google Maps (no API key needed). */
export function directionsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** How close (km) someone has to be for the app to say they are at the post office. */
export const AT_OFFICE_KM = 0.15;

/** Short distance for status messages: metres under a kilometre, kilometres above. */
export function formatShortDistance(km: number): string {
  return km < 1
    ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
    : formatDistance(km);
}

export type Proximity = "unknown" | "here" | "away";

/** Whether a measured distance counts as being at the post office. `null` means no location yet. */
export function proximity(km: number | null): Proximity {
  if (km === null) return "unknown";
  return km <= AT_OFFICE_KM ? "here" : "away";
}
