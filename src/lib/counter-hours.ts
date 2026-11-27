/**
 * One line for the office page: "Timings: 9 AM – 5 PM · OPEN".
 *
 * PLACEHOLDER HOURS: edit the constants below once the real ones are known.
 * Indian time (IST) whatever the device timezone. Mirrored in
 * flutter_app/lib/core/counter_hours.dart: change both.
 */
export type CounterState = "open" | "lunch" | "closed";

export interface CounterStatus {
  state: CounterState;
  /** e.g. "9 AM – 5 PM" (or "Closed today" on a Sunday). */
  hours: string;
  /** "OPEN" | "LUNCH" | "CLOSED". */
  word: string;
}

const OPEN = 9 * 60;
const CLOSE_WEEKDAY = 17 * 60;
const CLOSE_SATURDAY = 13 * 60;
const LUNCH_START = 13 * 60;
const LUNCH_END = 14 * 60;
const IST_OFFSET_MIN = 330;

function clock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export function counterStatus(now: Date): CounterStatus {
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const day = ist.getUTCDay();
  const min = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (day === 0) return { state: "closed", hours: "Closed Sundays", word: "CLOSED" };
  const close = day === 6 ? CLOSE_SATURDAY : CLOSE_WEEKDAY;
  const hours = `${clock(OPEN)} – ${clock(close)}`;
  if (min < OPEN || min >= close) return { state: "closed", hours, word: "CLOSED" };
  if (day !== 6 && min >= LUNCH_START && min < LUNCH_END) return { state: "lunch", hours, word: "LUNCH" };
  return { state: "open", hours, word: "OPEN" };
}
