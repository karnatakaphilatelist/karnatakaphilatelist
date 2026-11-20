"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isNativeApp } from "@/lib/native";

/**
 * Smooth, inertia-based page scroll for the public landing page only. Never mount this
 * inside the app shell: every other screen scrolls in its own fixed-height panel (and
 * Explore owns a Leaflet map), which Lenis fights. It also never runs inside the native
 * app's WebView — phones already scroll smoothly, and the native shell shows this page
 * only for an instant before redirecting to the tour or the map.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (isNativeApp()) return;
    // Registering ScrollTrigger touches matchMedia, and Lenis needs a real
    // ResizeObserver — jsdom (tests) and a few very old WebViews have neither.
    if (typeof window.matchMedia !== "function") return;
    if (typeof ResizeObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
