"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * A quiet fade/rise for content as it mounts — the app-screen counterpart to `Reveal`.
 * Deliberately NOT scroll-linked and never touches Lenis: it plays once when the element
 * appears, so it's safe inside the native app's WebView and inside every screen's own
 * `overflow-y-auto` panel, which a ScrollTrigger bound to the window never sees. Never wrap
 * the map itself (or anything with its own drag/pinch/zoom) in this.
 */
export function Appear({
  children,
  className,
  /** Stagger position in a list (0, 1, 2, …) — each step adds a small extra delay. */
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // jsdom (tests) and some very old WebViews have no matchMedia at all.
      if (typeof window.matchMedia !== "function") return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          y: 16,
          opacity: 0,
          duration: 0.45,
          delay: Math.min(index, 8) * 0.05,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [index] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
