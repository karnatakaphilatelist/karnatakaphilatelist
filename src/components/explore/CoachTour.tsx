"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TOUR_SEEN_KEY } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

interface TourStep {
  /** Matches a `data-tour="…"` attribute somewhere on the screen. */
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: "search",
    title: "Search anywhere",
    body: "Type a post office name, a district or a pincode to jump straight to it.",
  },
  {
    target: "filters",
    title: "Filter by progress",
    body: "Show only the post offices you have not visited yet, the ones you planned, or the ones you have stamped.",
  },
  {
    target: "near-me",
    title: "Find what is close",
    body: "Tap Near me to sort the list by distance. Your location stays on your phone.",
  },
  {
    target: "list",
    title: "Browse the list",
    body: "Drag this bar up to see every post office. Tap one for its details and the Stamp it button.",
  },
  {
    target: "passport",
    title: "Your passport",
    body: "Every stamp you collect lands here, so you can watch your collection grow.",
  },
];

/** The first element with this tour name that is actually on screen (the controls exist twice: phone and desktop). */
function findTarget(name: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** Where the control for a step sits on screen right now, or null if it is not showing. */
function boxOf(step: TourStep): DOMRect | null {
  return findTarget(step.target)?.getBoundingClientRect() ?? null;
}

const SPOT_PADDING = 6;
const CARD_MARGIN = 16;
const CARD_MAX_WIDTH = 320;

interface CoachTourProps {
  /** True once the screen is calm enough to point at things: the map is up and no sheet is open. */
  ready: boolean;
}

/**
 * A first-visit walkthrough of the map screen: the page dims, one control at a time is lit up
 * and explained. It can be skipped at any step, and once finished or skipped it never returns.
 */
export function CoachTour({ ready }: CoachTourProps) {
  const pathname = usePathname();
  const onExplore = pathname === "/explore";
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Start once, after the sheets have settled, and only for people who have not seen it.
  useEffect(() => {
    if (!ready || !onExplore || steps !== null) return;
    if (readJson<boolean>(TOUR_SEEN_KEY, false)) return;
    const timer = window.setTimeout(() => {
      const available = STEPS.filter((step) => findTarget(step.target) !== null);
      if (available.length === 0) return;
      setSteps(available);
      setIndex(0);
      setBox(boxOf(available[0]));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [ready, onExplore, steps]);

  const step = steps?.[index] ?? null;

  // Follow the highlighted control through rotation, resizing and the list sheet's slide.
  useEffect(() => {
    if (!step) return;
    const measure = () => setBox(boxOf(step));
    const settle = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useEffect(() => {
    if (step) nextRef.current?.focus({ preventScroll: true });
  }, [step]);

  const finish = useCallback(() => {
    writeJson(TOUR_SEEN_KEY, true);
    setSteps(null);
  }, []);

  function goTo(next: number) {
    if (!steps) return;
    setIndex(next);
    setBox(boxOf(steps[next]));
  }

  useEffect(() => {
    if (!step) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  // Leaving the map screen mid-tour hides it; it is picked up again when they return.
  if (!steps || !step || !onExplore) return null;

  const last = index === steps.length - 1;
  const viewportWidth = typeof window === "undefined" ? 360 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 640 : window.innerHeight;
  const cardWidth = Math.min(CARD_MAX_WIDTH, viewportWidth - CARD_MARGIN * 2);

  const spot = box
    ? {
        top: box.top - SPOT_PADDING,
        left: box.left - SPOT_PADDING,
        width: box.width + SPOT_PADDING * 2,
        height: box.height + SPOT_PADDING * 2,
      }
    : null;

  // Put the card on the side of the highlight that has more room.
  const above = spot ? spot.top + spot.height / 2 > viewportHeight / 2 : false;
  const cardLeft = spot
    ? Math.min(
        Math.max(spot.left + spot.width / 2 - cardWidth / 2, CARD_MARGIN),
        viewportWidth - CARD_MARGIN - cardWidth
      )
    : (viewportWidth - cardWidth) / 2;
  const arrowLeft = spot
    ? Math.min(Math.max(spot.left + spot.width / 2 - cardLeft - 8, 20), cardWidth - 36)
    : null;
  const cardStyle = spot
    ? above
      ? { left: cardLeft, width: cardWidth, bottom: viewportHeight - spot.top + 14 }
      : { left: cardLeft, width: cardWidth, top: spot.top + spot.height + 14 }
    : { left: cardLeft, width: cardWidth, top: viewportHeight / 2 - 90 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App tour"
      className="fixed inset-0 z-[3000]"
    >
      {/* Catches taps so the page underneath is not used by accident while the tour is up. */}
      <div className="absolute inset-0" aria-hidden="true" />

      {spot ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl shadow-[0_0_0_9999px_rgb(22_32_79/0.68)] ring-2 ring-white/90 motion-safe:transition-[top,left,width,height] motion-safe:duration-300"
          style={spot}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/65" aria-hidden="true" />
      )}

      <div
        className="absolute rounded-2xl bg-white p-4 text-ink shadow-2xl"
        style={cardStyle}
      >
        {spot && arrowLeft !== null ? (
          <span
            aria-hidden="true"
            className={`absolute size-4 rotate-45 bg-white ${
              above ? "-bottom-1.5" : "-top-1.5"
            }`}
            style={{ left: arrowLeft }}
          />
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {index + 1} of {steps.length}
        </p>
        <h2 className="mt-1 font-display text-xl font-bold leading-tight">
          {step.title}
        </h2>
        <p className="mt-1.5 text-[15px] leading-6 text-muted">{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="min-h-11 rounded-full px-3 text-sm font-semibold text-muted"
          >
            Skip tour
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={() => (last ? finish() : goTo(index + 1))}
            className="min-h-11 rounded-full bg-postal px-6 text-sm font-bold text-white"
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
