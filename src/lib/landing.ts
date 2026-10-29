/** Small pure helpers for the landing page, kept apart from React so they are easy to test. */

/** Set (for two minutes) when someone has just signed in, so the intro does not replay on the way back. */
export const SKIP_INTRO_COOKIE = "kp_skip_intro";
export const SKIP_INTRO_SECONDS = 120;
/** Marks on window that the intro already played in this page load (a reload clears it). */
export const INTRO_PLAYED_FLAG = "__kpIntroPlayed";

/** Seconds into the intro at which the postcard starts and finishes its trip along the line. */
export const CARD_TRAVEL = { start: 0.5, end: 3.0 } as const;
/** Seconds into the intro at which the page splits open. */
export const SPLIT_AT = 3.5;
/** How long the split animation takes (matches the CSS). */
export const SPLIT_DURATION_MS = 1300;

/** Starts slow, speeds up, then slows again. `k` and the result are both 0 to 1. */
export function easeInOut(k: number): number {
  const x = Math.min(1, Math.max(0, k));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** How far through its trip the postcard is at `seconds`, 0 to 1 (eased). */
export function cardProgress(seconds: number): number {
  const { start, end } = CARD_TRAVEL;
  return easeInOut((seconds - start) / (end - start));
}

/** The counter text, always three digits: 000 up to the number of post offices. */
export function formatCounter(progress: number, total: number): string {
  const value = Math.round(
    Math.min(1, Math.max(0, progress)) * Math.max(0, total)
  );
  return String(value).padStart(3, "0");
}

/**
 * How far the map card has opened, 0 to 1, from how far the page has scrolled.
 * It reaches 1 after `finishAt` (default 70%) of the available scroll, so the
 * last stretch of scrolling simply rests on the open map.
 */
export function scrollProgress(
  scrollY: number,
  maxScroll: number,
  finishAt = 0.7
): number {
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / (maxScroll * finishAt)));
}

interface Located {
  id: number;
  lat: number | null;
  lng: number | null;
}

export interface PlacedPin {
  id: number;
  /** Position inside the map card, in percent. */
  x: number;
  y: number;
}

/**
 * Places each post office inside a rectangle by its real latitude and longitude, so the
 * landing card shows the true shape of the pins without loading a map. Offices
 * without coordinates are left out.
 */
export function projectPins(offices: Located[], padding = 8): PlacedPin[] {
  const located = offices.filter(
    (office): office is Located & { lat: number; lng: number } =>
      office.lat !== null && office.lng !== null
  );
  if (located.length === 0) return [];

  const lats = located.map((office) => office.lat);
  const lngs = located.map((office) => office.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const span = 100 - padding * 2;
  const scale = (value: number, min: number, max: number) =>
    max === min ? 50 : padding + ((value - min) / (max - min)) * span;

  return located.map((office) => ({
    id: office.id,
    x: round(scale(office.lng, minLng, maxLng)),
    // North is up, so a larger latitude has a smaller y.
    y: round(100 - scale(office.lat, minLat, maxLat)),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
