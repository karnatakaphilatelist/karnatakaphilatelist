"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { isNativeApp } from "@/lib/native";
import { PLAY_STORE_LIVE, PLAY_STORE_URL } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

const DISMISSED_KEY = "kp:app-nudge-dismissed:v1";

/** Wait this long after a signed-in person has stamped their first office. */
const NUDGE_DELAY_MS = 4000;
/** If another dialog is open when the time comes, look again after this long. */
const NUDGE_RETRY_MS = 2000;

/**
 * A small floating nudge inviting signed-in, web-only visitors who have
 * stamped at least one office to install the app. Complements the two
 * existing guest-only nudges (WebSignInNudge, GuestSignInPrompt) rather than
 * competing with them — this one only ever shows to people who are already
 * signed in, so the three never fire for the same visitor at once.
 * Dismissed once per device. No-op in the native app, and inert entirely
 * until PLAY_STORE_LIVE is flipped on (there's no public listing yet).
 */
export function AppDownloadNudge() {
  const { user, isLoading } = useAuth();
  const { visits, isReady } = useVisits();
  const visitCount = Object.keys(visits).length;
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!PLAY_STORE_LIVE || isNativeApp()) return;
    if (isLoading || !isReady || !user) return;
    if (visitCount < 1) return;
    if (readJson(DISMISSED_KEY, false)) return;

    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      if (document.querySelector("dialog[open]")) {
        timer = setTimeout(attempt, NUDGE_RETRY_MS);
        return;
      }
      setVisible(true);
    };
    timer = setTimeout(attempt, NUDGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading, isReady, user, visitCount]);

  function dismiss() {
    setLeaving(true);
    writeJson(DISMISSED_KEY, true);
    setTimeout(() => setVisible(false), 250);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-[2000] flex max-w-[280px] items-stretch overflow-hidden rounded-xl shadow-[0_4px_24px_rgba(22,32,79,0.13)] transition-all duration-250 ${
        leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ animation: leaving ? undefined : "nudge-rise 0.3s ease-out" }}
    >
      <div
        aria-hidden="true"
        className="kp-perforated w-3 shrink-0"
        style={{ "--stamp": "var(--color-postal-soft)" } as React.CSSProperties}
      />

      <div className="flex flex-col gap-1.5 bg-paper px-4 py-3">
        <p className="text-xs font-semibold leading-snug text-ink">
          Take your trail with you
        </p>
        <p className="text-[11px] leading-snug text-muted">
          Get the app for quicker stamping on the go.
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener"
            onClick={dismiss}
            className="rounded-full bg-postal px-3 py-1 text-[11px] font-bold text-white"
          >
            Get the app
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-[11px] text-muted underline-offset-2 hover:underline"
          >
            Not now
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-2 top-2 text-muted/60 hover:text-muted"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
