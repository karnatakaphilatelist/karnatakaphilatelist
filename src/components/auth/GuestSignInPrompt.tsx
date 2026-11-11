"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  COACH_KEY,
  GUEST_SIGN_IN_THRESHOLD,
  SIGN_IN_PROMPTED_KEY,
  WELCOME_PROMPTED_KEY,
} from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

/**
 * Wait this long after the threshold is reached, so the "Stamped" sheet
 * (and its "Add note and photo" button) is not buried under the sign-in dialog
 * at the very moment the person wants to add a note.
 */
export const PROMPT_DELAY_MS = 7000;
/** If another dialog is open when the time comes, look again after this long. */
export const PROMPT_RETRY_MS = 2000;

/** How long after the map opens (and the quick tour has finished) the first invitation appears. */
export const WELCOME_DELAY_MS = 2500;

/**
 * Invites a guest to sign in once they have stamped a few offices, so progress
 * is not lost when they change phones. Shown once per device, never on top of
 * another dialog.
 */
export function GuestSignInPrompt() {
  const { user, isLoading, openSignIn } = useAuth();
  const { visits, isReady } = useVisits();
  const visitCount = Object.keys(visits).length;
  const pathname = usePathname();

  // The first invitation: once per device, on the map, after the quick tour is over. "Maybe later" closes it
  // and the app works fully without signing in.
  useEffect(() => {
    if (isLoading || user || pathname !== "/explore") return;
    if (readJson(WELCOME_PROMPTED_KEY, false)) return;

    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      // Wait for the tour to finish and never interrupt another dialog.
      if (
        !readJson(COACH_KEY, false) ||
        document.querySelector("dialog[open]")
      ) {
        timer = setTimeout(attempt, PROMPT_RETRY_MS);
        return;
      }
      writeJson(WELCOME_PROMPTED_KEY, true);
      openSignIn("welcome");
    };
    timer = setTimeout(attempt, WELCOME_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading, user, pathname, openSignIn]);

  useEffect(() => {
    if (isLoading || !isReady || user) return;
    if (visitCount < GUEST_SIGN_IN_THRESHOLD) return;
    if (readJson(SIGN_IN_PROMPTED_KEY, false)) return;

    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      // Never interrupt something the person is in the middle of.
      if (document.querySelector("dialog[open]")) {
        timer = setTimeout(attempt, PROMPT_RETRY_MS);
        return;
      }
      writeJson(SIGN_IN_PROMPTED_KEY, true);
      openSignIn("save-progress");
    };
    timer = setTimeout(attempt, PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading, isReady, user, visitCount, openSignIn]);

  return null;
}
