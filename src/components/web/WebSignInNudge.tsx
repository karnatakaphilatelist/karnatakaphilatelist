"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isNativeApp } from "@/lib/native";

const DISMISSED_KEY = "kp:nudge-dismissed:v1";

/**
 * A small floating nudge that appears on web-only after the user has scrolled
 * 55% down the page — signals genuine reading intent, not a bounce.
 * Shown once per browser session. No-op in the native app.
 */
export function WebSignInNudge() {
  const { user, isLoading, openSignIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (isLoading || user || isNativeApp()) return;
    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // sessionStorage blocked (private mode) — still show it
    }

    const onScroll = () => {
      if (fired.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.55) {
        fired.current = true;
        window.removeEventListener("scroll", onScroll);
        setVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoading, user]);

  function dismiss() {
    setLeaving(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
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
      {/* Stamp-perforation strip — the one unexpected detail */}
      <div
        aria-hidden="true"
        className="kp-perforated w-3 shrink-0"
        style={{ "--stamp": "var(--color-postal-soft)" } as React.CSSProperties}
      />

      {/* Card body */}
      <div className="flex flex-col gap-1.5 bg-paper px-4 py-3">
        <p className="text-xs font-semibold leading-snug text-ink">
          Save your trail as you go
        </p>
        <p className="text-[11px] leading-snug text-muted">
          Free account — your postmarks stay safe.
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              dismiss();
              openSignIn("manual");
            }}
            className="rounded-full bg-postal px-3 py-1 text-[11px] font-bold text-white"
          >
            Sign in free
          </button>
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

      {/* Close */}
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
