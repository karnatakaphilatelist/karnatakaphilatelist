"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COACH_EVENT, COACH_KEY } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

interface Stop {
  /** Matches `data-tour` values; the first one that is on screen is used. */
  targets: string[];
  title: string;
  body: string;
}

const STOPS: Stop[] = [
  {
    targets: ["search-mobile", "search-desktop"],
    title: "Search",
    body: "Type a post office name, district or pincode to jump straight to it.",
  },
  {
    targets: ["filters-mobile", "filters-desktop"],
    title: "Filters",
    body: "Show only the ones you have not visited yet, the ones you plan to visit, or your stamped ones.",
  },
  {
    targets: ["near-me"],
    title: "Near me",
    body: "Find the closest post offices. We only use your location while you are using the app.",
  },
  {
    targets: ["sheet"],
    title: "The full list",
    body: "Tap Show list, or drag the bar up, to see every post office. Show map brings you back.",
  },
  {
    targets: ["tab-passport"],
    title: "Your passport",
    body: "Every stamp you collect lands here, so you can watch your count grow.",
  },
  {
    targets: ["tab-account"],
    title: "Your account",
    body: "Sign in to keep your passport safe and on every device. You can skip it for now.",
  },
];

interface Placed {
  stop: Stop;
  rect: { top: number; left: number; width: number; height: number };
}

function findVisible(targets: string[]) {
  for (const name of targets) {
    for (const el of document.querySelectorAll<HTMLElement>(
      `[data-tour="${name}"]`
    )) {
      const box = el.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) return box;
    }
  }
  return null;
}

/** A short "here is what this does" walkthrough over the map screen. Shown once; can be skipped or replayed. */
export function CoachTour() {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);

  const start = useCallback(() => {
    writeJson(COACH_KEY, true);
    setIndex(0);
    setRunning(true);
  }, []);

  // First visit to the map: begin once the screen has settled.
  useEffect(() => {
    if (pathname !== "/explore" || readJson<boolean>(COACH_KEY, false)) return;
    const timer = window.setTimeout(start, 1200);
    return () => window.clearTimeout(timer);
  }, [pathname, start]);

  // "Replay the walkthrough" in Settings.
  useEffect(() => {
    const onReplay = () => window.setTimeout(start, 600);
    window.addEventListener(COACH_EVENT, onReplay);
    return () => window.removeEventListener(COACH_EVENT, onReplay);
  }, [start]);

  // Measure what is actually on screen (phone and desktop show different things).
  useEffect(() => {
    if (!running) return;
    const measure = () => {
      const next: Placed[] = [];
      for (const stop of STOPS) {
        const box = findVisible(stop.targets);
        if (box)
          next.push({
            stop,
            rect: {
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
            },
          });
      }
      setPlaced(next);
      if (next.length === 0) setRunning(false);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [running]);

  const close = useCallback(() => setRunning(false), []);

  useEffect(() => {
    if (!running) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    nextRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [running, close, index]);

  const current = placed[Math.min(index, placed.length - 1)];
  if (!running || !current) return null;

  const last = index >= placed.length - 1;
  const { rect } = current;
  const pad = 6;
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  const cardStyle = below
    ? { top: rect.top + rect.height + pad + 12 }
    : { bottom: window.innerHeight - rect.top + pad + 12 };

  return (
    <div
      className="fixed inset-0 z-[3000]"
      role="dialog"
      aria-modal="true"
      aria-label="App walkthrough"
    >
      {/* The cut-out: a clear box over the target, with a big shadow dimming everything else. */}
      <div
        className="pointer-events-none absolute rounded-2xl ring-2 ring-white/90 transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 9999px rgb(22 32 79 / 0.72)",
        }}
      />
      {/* Taps outside the card do nothing, so the app underneath is not poked by accident. */}
      <div className="absolute inset-0" />
      <div
        className="absolute inset-x-4 mx-auto max-w-sm rounded-3xl bg-paper p-5 text-ink shadow-2xl"
        style={cardStyle}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {Math.min(index, placed.length - 1) + 1} of {placed.length}
        </p>
        <h2 className="mt-1 font-display text-xl font-bold">
          {current.stop.title}
        </h2>
        <p className="mt-1.5 text-base leading-6 text-muted">
          {current.stop.body}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-full px-3 text-sm font-semibold text-muted"
          >
            Skip tour
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={() => (last ? close() : setIndex(index + 1))}
            className="min-h-11 rounded-full bg-postal px-6 text-base font-bold text-white"
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
