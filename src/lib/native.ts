import { Capacitor } from "@capacitor/core";

/**
 * The custom URL scheme used as an OAuth redirect on iOS (SFSafariViewController
 * can open custom schemes; Android Chrome Custom Tabs cannot).
 */
const IOS_AUTH_REDIRECT = "app.vinvi.philatrail://auth/callback";

/**
 * The HTTPS App Link used as an OAuth redirect on Android.
 *
 * Chrome Custom Tabs cannot redirect to custom URL schemes — the redirect silently
 * fails and the app never receives the PKCE code.  An App Link works because Android
 * verifies the digital-asset-links file and intercepts the HTTPS URL before it
 * reaches the WebView, firing appUrlOpen on the running activity.
 */
const ANDROID_AUTH_REDIRECT = "https://philatrail.com/auth/callback";

/**
 * Returns the redirect URL appropriate for the current platform.
 * Falls back to the HTTPS form so the web flow also uses a valid URL.
 */
export function nativeAuthRedirect(): string {
  try {
    return Capacitor.getPlatform() === "ios"
      ? IOS_AUTH_REDIRECT
      : ANDROID_AUTH_REDIRECT;
  } catch {
    return ANDROID_AUTH_REDIRECT;
  }
}

/**
 * @deprecated Use nativeAuthRedirect() instead — it returns the right URL per platform.
 * Kept only so imports don't break before callers are updated.
 */
export const NATIVE_AUTH_REDIRECT = ANDROID_AUTH_REDIRECT;

/** True when running inside the iOS or Android app rather than a normal browser. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Pulls the one-time sign-in code out of the link the system browser opened the app with.
 * Handles both:
 *   - https://philatrail.com/auth/callback?code=xxx  (Android App Link)
 *   - app.vinvi.philatrail://auth/callback?code=xxx  (iOS custom scheme)
 */
export function parseNativeAuthCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    // iOS custom scheme form
    if (
      parsed.protocol === "app.vinvi.philatrail:" &&
      parsed.host === "auth" &&
      parsed.pathname === "/callback"
    ) {
      return parsed.searchParams.get("code");
    }
    // Android HTTPS App Link form
    if (
      (parsed.hostname === "philatrail.com" ||
        parsed.hostname === "www.philatrail.com") &&
      parsed.pathname === "/auth/callback"
    ) {
      return parsed.searchParams.get("code");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * For a tapped philatrail.com link that opened the app, the page path to show
 * (for example "/offices/hampi-so-583239"). Null for any other link.
 * Auth-callback links are NOT treated as navigation — parseNativeAuthCode handles those.
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
    // Auth callbacks are handled by parseNativeAuthCode, not as page navigation.
    if (link.pathname === "/auth/callback") return null;
    return `${link.pathname}${link.search}`;
  } catch {
    return null;
  }
}
