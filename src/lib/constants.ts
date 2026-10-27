import type { Coordinates } from "@/types";

/** localStorage keys. Bump the version suffix if a stored shape ever changes. */
export const GUEST_VISITS_KEY = "kp:guest-visits:v1";
export const PLANNED_KEY = "kp:planned:v1";
export const SIGN_IN_PROMPTED_KEY = "kp:sign-in-prompted:v1";

/** A guest is invited to sign in once they have stamped this many offices. */
export const GUEST_SIGN_IN_THRESHOLD = 3;

export const KARNATAKA_CENTER: Coordinates = { lat: 15.3173, lng: 75.7139 };
export const KARNATAKA_DEFAULT_ZOOM = 7;

/** Where people write to ask about their data or report a problem. Shown on the legal pages. */
export const CONTACT_EMAIL = "karnatakaphilatelist@gmail.com";
export const LEGAL_LAST_UPDATED = "27 October 2026";

/** Shown in the footer of the passport and legal pages. */
export const DISCLAIMER =
  "Karnataka Philatelic Passport is an independent project. It is not run, endorsed or sponsored by India Post or the Government of Karnataka. India Post and related names belong to their owners.";
