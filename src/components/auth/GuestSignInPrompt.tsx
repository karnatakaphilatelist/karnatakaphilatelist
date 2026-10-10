"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { GUEST_SIGN_IN_THRESHOLD, SIGN_IN_PROMPTED_KEY } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

/**
 * Invites a guest to sign in once they have stamped a few offices, so progress
 * is not lost when they change phones. Shown once per device, never blocking.
 */
export function GuestSignInPrompt() {
  const { user, isLoading, openSignIn } = useAuth();
  const { visits, isReady } = useVisits();
  const visitCount = Object.keys(visits).length;

  useEffect(() => {
    if (isLoading || !isReady || user) return;
    if (visitCount < GUEST_SIGN_IN_THRESHOLD) return;
    if (readJson(SIGN_IN_PROMPTED_KEY, false)) return;

    writeJson(SIGN_IN_PROMPTED_KEY, true);
    openSignIn("save-progress");
  }, [isLoading, isReady, user, visitCount, openSignIn]);

  return null;
}
