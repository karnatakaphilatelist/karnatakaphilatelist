/** A calendar date as YYYY-MM-DD in the device's local time zone. */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as YYYY-MM-DD, built by hand so it never depends on the browser's locale data. */
export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
