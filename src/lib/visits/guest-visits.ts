import { ISO_DATE_PATTERN, todayIso } from "@/lib/date";
import type { Visit } from "@/types";

export const MAX_NOTE_LENGTH = 1000;

/**
 * Turns whatever is stored on the device into clean guest visits.
 *
 * localStorage can hold anything: an older app version's shape, a hand-edited
 * value, or a half-written string. Rows that cannot be trusted are dropped
 * (or repaired where that is safe) so they can never crash the app or be sent
 * to the database. Guests cannot have photos, so `photoPath` is always null.
 */
export function parseGuestVisits(raw: unknown): Visit[] {
  if (!Array.isArray(raw)) return [];

  const byOffice = new Map<number, Visit>();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;

    const officeId = row.officeId;
    if (typeof officeId !== "number" || !Number.isSafeInteger(officeId) || officeId <= 0) {
      continue;
    }

    const visitedAt =
      typeof row.visitedAt === "string" && ISO_DATE_PATTERN.test(row.visitedAt)
        ? row.visitedAt
        : todayIso();
    const note = typeof row.note === "string" ? row.note.slice(0, MAX_NOTE_LENGTH) : "";

    byOffice.set(officeId, {
      officeId,
      visitedAt,
      note,
      photoPath: null,
      isPublic: row.isPublic === true,
    });
  }
  return [...byOffice.values()];
}

/** Planned office ids stored on the device, ignoring anything that is not a whole number. */
export function parsePlannedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (value): value is number => typeof value === "number" && Number.isSafeInteger(value),
  );
}
