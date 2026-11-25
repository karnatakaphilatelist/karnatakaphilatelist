import type { Coordinates } from "@/types";

/** localStorage keys. Bump the version suffix if a stored shape ever changes. */
export const GUEST_VISITS_KEY = "kp:guest-visits:v1";
export const PLANNED_KEY = "kp:planned:v1";
export const SIGN_IN_PROMPTED_KEY = "kp:sign-in-prompted:v1";
/** Set once the upfront sign-in invitation has been shown on this device. */
export const WELCOME_PROMPTED_KEY = "kp:welcome-prompted:v1";

/** A guest is invited to sign in once they have stamped this many offices. */
export const GUEST_SIGN_IN_THRESHOLD = 3;

/** Where the map starts before it fits itself to the post offices on show. */
export const MAP_START_CENTER: Coordinates = { lat: 22.5, lng: 79 };
export const MAP_START_ZOOM = 5;

/** The public address of the site. Used for canonical links and social previews. */
export const SITE_URL = "https://philatrail.com";

/** The share image. A page that sets its own openGraph replaces the site-wide one, so each such page repeats this. */
export const OG_IMAGE = { url: "/og-image.png", width: 1024, height: 500, alt: "Philatrail" };

/** Where people write to ask about their data or report a problem. Shown on the legal pages. */
export const CONTACT_EMAIL = "karnatakaphilatelist@gmail.com";
export const LEGAL_LAST_UPDATED = "17 November 2026";

/** Shown in the footer of the passport and legal pages. */
export const DISCLAIMER =
  "Philatrail is an independent project. It is not run, endorsed or sponsored by India Post or any state or central government. India Post and related names belong to their owners.";

/** Set once a person has seen (or skipped) the first-launch welcome tour. */
export const ONBOARDED_KEY = "kp:onboarded:v1";
/** Set once we have explained why we ask for location, before the first system prompt. */
export const LOCATION_PRIMED_KEY = "kp:location-primed:v1";
/** Set on <html> while the map walkthrough is on screen. */
export const COACH_RUNNING_ATTR = "data-coach-running";
/** Remembers that the pointing-out walkthrough on the map has been shown. */
export const COACH_KEY = "kp:coach:v1";
/** Fired to start the walkthrough again, for example from Settings. */
export const COACH_EVENT = "kp:start-coach";
/**
 * Fired when the Explore tab is tapped while already on /explore. Same-URL
 * taps don't trigger Next.js navigation (and the screen stays mounted across
 * tabs anyway), so without this a search, filter, or open detail card from
 * before would just sit there looking stuck instead of the tab acting like a
 * fresh "go to Explore".
 */
export const EXPLORE_RESET_EVENT = "kp:explore-reset";
/** Lite mode: no textures or motion, for older phones and battery saving. */
export const LITE_MODE_KEY = "kp:lite:v1";
export const AFTER_AUTH_KEY = "kp:after-auth:v1";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.vinvi.philatrail";
/**
 * Flip to true once the app is public on Google Play (closed testing links
 * don't work for everyone). Temporarily true at the user's request on 25 Nov
 * 2026 so they can preview the nudge — the Play Store link itself will still
 * 404 for anyone not already an opted-in closed tester. Flip back to false
 * once previewed, or when a real listing goes live for real.
 */
export const PLAY_STORE_LIVE = true;

/** Where the "Contribute" button on the Support section sends people, once a payment rail is set up. */
export const SUPPORT_LINK_URL = "";
/** Flip to true once SUPPORT_LINK_URL is a real, working give-link. */
export const SUPPORT_LIVE = false;
