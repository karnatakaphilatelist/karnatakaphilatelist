/**
 * Google Analytics, loaded through the Google tag (see the root layout).
 *
 * Events carry no personal details: never pass an email address, name, note or photo.
 * Everything here quietly does nothing when the tag is missing or blocked, so the app never
 * depends on it.
 */
export const GOOGLE_TAG_ID = "GTM-MZSMW6KJ";

type Gtag = (...args: unknown[]) => void;

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.("event", name, params ?? {});
  } catch {
    // Analytics must never break the page.
  }
}

/** Splits app traffic from website traffic in reports. Call once per page load. */
export function setPlatform(platform: "app" | "web"): void {
  if (typeof window === "undefined") return;
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.("set", "user_properties", { platform });
  } catch {
    // Ignore.
  }
}

/**
 * The events to send after someone's stamp count reaches `count`.
 * Every stamp is counted; the first and third are also sent as milestones.
 */
export function stampEvents(count: number): string[] {
  const events = ["stamp_collected"];
  if (count === 1) events.push("first_stamp");
  if (count === 3) events.push("third_stamp");
  return events;
}
