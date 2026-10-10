import type { Coordinates } from "@/types";

/** localStorage keys. Bump the version suffix if a stored shape ever changes. */
export const GUEST_VISITS_KEY = "kp:guest-visits:v1";
export const PLANNED_KEY = "kp:planned:v1";
export const SIGN_IN_PROMPTED_KEY = "kp:sign-in-prompted:v1";

/** A guest is invited to sign in once they have stamped this many offices. */
export const GUEST_SIGN_IN_THRESHOLD = 3;

export const KARNATAKA_CENTER: Coordinates = { lat: 15.3173, lng: 75.7139 };
export const KARNATAKA_DEFAULT_ZOOM = 7;
