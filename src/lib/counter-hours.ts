/**
 * "Is the counter open right now?" for an Indian sub-post office.
 *
 * These are the *typical* published hours, not per-office data: sub post
 * offices usually work Mon-Fri 10:00-16:00 and Sat 10:00-13:00, close on
 * Sunday, may pause around 13:00-13:30, and sell philatelic stamps only
 * until about 15:00. Individual offices differ and public holidays are not
 * known, so every label says "usually" and the UI says to check locally.
 * Mirrored in flutter_app/lib/core/counter_hours.dart: change both.
 */
export type CounterState = "open" | "closing" | "lunch" | "stamps-closed" | "closed";

export interface CounterStatus {
  state: CounterState;
  /** Short line for the office page. */
  label: string;
}

const IST_OFFSET_MIN = 330;
const OPEN = 10 * 60;
const LUNCH_START = 13 * 60;
const LUNCH_END = 13 * 60 + 30;
const STAMP_CUTOFF = 15 * 60;
const CLOSE_WEEKDAY = 16 * 60;
const CLOSE_SATURDAY = 13 * 60;
const CLOSING_SOON_MIN = 30;


function clock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export function counterStatus(now: Date): CounterStatus {
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const day = ist.getUTCDay();
  const min = ist.getUTCHours() * 60 + ist.getUTCMinutes();

  if (day === 0) return { state: "closed", label: `Closed Sunday · usually opens Mon ${clock(OPEN)}` };

  const close = day === 6 ? CLOSE_SATURDAY : CLOSE_WEEKDAY;
  if (min < OPEN) return { state: "closed", label: `Closed · usually opens today ${clock(OPEN)}` };
  if (min >= close) {
    const tomorrow = day === 6 ? `Mon ${clock(OPEN)}` : `tomorrow ${clock(OPEN)}`;
    return { state: "closed", label: `Closed for the day · usually opens ${tomorrow}` };
  }
  if (day !== 6 && min >= STAMP_CUTOFF) {
    return {
      state: "stamps-closed",
      label: `Stamp counter has probably closed · most stop selling by ${clock(STAMP_CUTOFF)}`,
    };
  }
  if (day !== 6 && min >= LUNCH_START && min < LUNCH_END) {
    return { state: "lunch", label: `May be on lunch break · usually back by ${clock(LUNCH_END)}` };
  }
  const stampEnd = day === 6 ? close : STAMP_CUTOFF;
  if (stampEnd - min <= CLOSING_SOON_MIN) {
    return { state: "closing", label: `Closing soon · stamps usually until ${clock(stampEnd)}` };
  }
  return { state: "open", label: `Counter usually open · stamps until ${clock(stampEnd)}` };
}
