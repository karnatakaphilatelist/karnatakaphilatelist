/**
 * In-app review prompt for Philatrail.
 *
 * Shows the Play Store / App Store review sheet after the user earns their
 * 3rd stamp — once per install.  The OS/Play layer rate-limits actual prompts
 * so calling requestReview() is always safe; we add our own one-time guard so
 * we don't repeatedly attempt it after every stamp past the threshold.
 *
 * No-op in the browser.
 */

import { Capacitor } from "@capacitor/core";

/** localStorage key: set to "1" once we've requested a review. */
const REVIEW_ASKED_KEY = "pt_review_asked";

/** Minimum stamps before we ask. */
const REVIEW_AFTER_STAMPS = 3;

/**
 * Call after every stamp.  Triggers a review prompt once the user has earned
 * REVIEW_AFTER_STAMPS stamps and we haven't asked before.
 */
export async function maybeRequestReview(totalStamps: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (totalStamps < REVIEW_AFTER_STAMPS) return;

  try {
    if (localStorage.getItem(REVIEW_ASKED_KEY)) return;
    localStorage.setItem(REVIEW_ASKED_KEY, "1");
  } catch {
    // Can't read/write localStorage — proceed anyway; the OS will rate-limit.
  }

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch {
    // Best-effort — review dialog is never critical.
  }
}
