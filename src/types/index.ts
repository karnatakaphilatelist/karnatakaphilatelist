/** A post office listed in the Karnataka philatelic passport. */
export interface PostOffice {
  id: number;
  name: string;
  pincode: string;
  district: string;
  /** Null when the office has no coordinates yet; such offices are listed but not mapped. */
  lat: number | null;
  lng: number | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type OfficeStatus = "unvisited" | "planned" | "visited";

/** A post office combined with the current user's progress and location. */
export interface OfficeWithStatus extends PostOffice {
  status: OfficeStatus;
  /** Straight-line distance from the user; null until location is shared. */
  distanceKm: number | null;
}

/** A user's visit to one post office. */
export interface Visit {
  officeId: number;
  /** ISO calendar date, e.g. "2026-10-11". */
  visitedAt: string;
  note: string;
  /** Path inside the private `stamp-photos` storage bucket. */
  photoPath: string | null;
  isPublic: boolean;
}

/** Fields a user can change after marking an office as visited. */
export type VisitPatch = Partial<Pick<Visit, "note" | "photoPath" | "isPublic">>;
