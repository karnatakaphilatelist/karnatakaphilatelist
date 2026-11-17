import { Capacitor } from "@capacitor/core";

/** The address the system browser sends people back to after signing in inside the mobile apps. */
export const NATIVE_AUTH_REDIRECT = "app.vinvi.philatrail://auth/callback";

/** True when running inside the iOS or Android app rather than a normal browser. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Pulls the one-time sign-in code out of the link the system browser opened the app with. */
export function parseNativeAuthCode(url: string): string | null {
  if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return null;
  try {
    return new URL(url).searchParams.get("code");
  } catch {
    return null;
  }
}

/**
 * For a tapped philatrail.com link that opened the app, the page path to show
 * (for example "/offices/hampi-so-583239"). Null for any other link.
 */
export function pathFromSiteLink(url: string): string | null {
  try {
    const link = new URL(url);
    if (link.protocol !== "https:") return null;
    if (
      link.hostname !== "philatrail.com" &&
      link.hostname !== "www.philatrail.com"
    ) {
      return null;
    }
    return `${link.pathname}${link.search}`;
  } catch {
    return null;
  }
}
