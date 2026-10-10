import { distanceKm } from "@/lib/geo";
import type {
  Coordinates,
  OfficeStatus,
  OfficeWithStatus,
  PostOffice,
  Visit,
} from "@/types";

export const STATUS_LABEL: Record<OfficeStatus, string> = {
  unvisited: "Not visited",
  planned: "Planned",
  visited: "Visited",
};

export function getOfficeStatus(
  officeId: number,
  visits: Record<number, Visit>,
  plannedIds: ReadonlySet<number>,
): OfficeStatus {
  if (visits[officeId]) return "visited";
  return plannedIds.has(officeId) ? "planned" : "unvisited";
}

/** Attaches the user's status and distance to each office. */
export function withStatus(
  offices: PostOffice[],
  visits: Record<number, Visit>,
  plannedIds: ReadonlySet<number>,
  userLocation: Coordinates | null,
): OfficeWithStatus[] {
  return offices.map((office) => ({
    ...office,
    status: getOfficeStatus(office.id, visits, plannedIds),
    distanceKm:
      userLocation && office.lat !== null && office.lng !== null
        ? distanceKm(userLocation, { lat: office.lat, lng: office.lng })
        : null,
  }));
}

/** Nearest first; offices without coordinates go last. */
export function sortByDistance(offices: OfficeWithStatus[]): OfficeWithStatus[] {
  return [...offices].sort(
    (a, b) =>
      (a.distanceKm ?? Number.POSITIVE_INFINITY) -
      (b.distanceKm ?? Number.POSITIVE_INFINITY),
  );
}

export function hasCoordinates<T extends PostOffice>(
  office: T,
): office is T & { lat: number; lng: number } {
  return office.lat !== null && office.lng !== null;
}
