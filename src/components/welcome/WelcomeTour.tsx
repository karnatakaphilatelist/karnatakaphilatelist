"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookIcon, CheckIcon, FlagIcon } from "@/components/ui/icons";
import { ONBOARDED_KEY } from "@/lib/constants";
import { writeJson } from "@/lib/local-storage";
import { isNativeApp } from "@/lib/native";
import "./tour.css";

interface Step {
  title: string;
  sub: string;
  body: string;
  /** Mark shown inside the halo at the right of the red hero. */
  mark: "pin" | "check" | "book";
}

const STEPS: Step[] = [
  {
    title: "Find it.",
    sub: "A post office near you",
    body: "Open the map and spot a post office close by. Green pins are places you have already stamped.",
    mark: "pin",
  },
  {
    title: "Visit it.",
    sub: "Go in person",
    body: "Visit the post office, ask for the postmark, then tap Stamp it. Add a note or photo if you like.",
    mark: "check",
  },
  {
    title: "Stamp it.",
    sub: "Fill your passport",
    body: "Each stamp lands in your passport. Watch your count grow, one post office at a time.",
    mark: "book",
  },
];

/** The mark of each step: a glowing halo with the thing you are looking for inside. */
function Halo({ mark }: { mark: Step["mark"] }) {
  return (
    <div
      aria-hidden="true"
      className="kpt-pop absolute bottom-6 right-6 grid size-28 [@media(max-height:720px)]:hidden place-items-center rounded-full bg-[#2f4aa8]/25"
    >
      <span className="absolute -inset-4 rounded-full border border-white/10" />
      <span className="absolute -inset-9 rounded-full border border-white/10" />
      {mark === "pin" ? (
        <span className="size-[52px] rounded-full border-[5px] border-white bg-[#2f4aa8] shadow-[0_3px_10px_rgb(47_74_168/0.6)]" />
      ) : mark === "check" ? (
        <span className="grid size-[52px] place-items-center rounded-full border-[5px] border-white bg-[#1f8a4d] text-white shadow-[0_3px_10px_rgb(31_138_77/0.6)]">
          <CheckIcon className="size-6" strokeWidth={3.4} />
        </span>
      ) : (
        <span className="grid size-[52px] place-items-center rounded-full border-[5px] border-white bg-postal text-white shadow-lg">
          <BookIcon className="size-6" />
        </span>
      )}
    </div>
  );
}

/** The three-step first-launch tour. Shown once, then the app opens on the map. */
export function WelcomeTour() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  // Counts as seen the moment it appears, so closing the app halfway never brings the tour back.
  useEffect(() => {
    writeJson(ONBOARDED_KEY, true);
  }, []);

  // Warm up the map while the tour is read, so "Start collecting" lands on a screen that is ready.
  useEffect(() => {
    router.prefetch("/explore");
    void import("@/components/map/OfficeMap");
    fetch("/explore", { credentials: "same-origin" }).catch(() => undefined);
  }, [router]);

  function finish() {
    // Inside the apps a plain page load has been far quicker and more dependable than the client router.
    if (isNativeApp()) window.location.replace("/explore");
    else router.replace("/explore");
  }

  // Swipe left for the next slide, right for the previous one.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  function onTouchEnd(x: number, y: number) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = x - start.x;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(y - start.y) * 1.5) return;
    if (dx < 0) {
      if (last) finish();
      else setStep(step + 1);
    } else if (step > 0) setStep(step - 1);
  }

  return (
    <main
      className="fixed inset-0 flex touch-pan-y flex-col md:relative md:inset-auto md:mx-auto md:mt-6 md:h-[calc(100dvh-3rem)] md:max-h-[860px] md:max-w-[430px] md:overflow-hidden md:rounded-[32px] md:shadow-[0_30px_80px_-30px_rgb(22_32_79/0.45)]"
      onTouchStart={(event) => {
        const t = event.touches[0];
        swipe.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(event) => {
        const t = event.changedTouches[0];
        onTouchEnd(t.clientX, t.clientY);
      }}
    >
      <section
        className="kp-red relative flex flex-[1.15] flex-col overflow-hidden px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white"
        aria-label="Welcome"
      >
        <div className="flex h-10 items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-[0.22em]">
            Philatrail
          </span>
          <button
            type="button"
            onClick={finish}
            className="-mr-2 min-h-11 px-2 text-xs font-bold uppercase tracking-[0.18em]"
          >
            Skip
          </button>
        </div>
        <div key={step} className="kpt-pop mt-6">
          <p className="flex items-center gap-3.5 text-xs font-bold uppercase tracking-[0.18em]">
            How it works
            <span aria-hidden className="h-4 w-px bg-[#f7c96b]" />
            {step + 1} of {STEPS.length}
          </p>
          <h1 className="-ml-1 mt-5 text-[72px] font-medium uppercase leading-[76px] tracking-[0.01em]">
            {current.title}
          </h1>
          <p className="mt-3 text-xl font-bold italic uppercase leading-6 tracking-[0.08em] text-[#f7c96b]">
            {current.sub}
          </p>
        </div>
        <Halo key={`halo-${step}`} mark={current.mark} />
      </section>

      <section className="flex flex-1 flex-col px-4 pb-8 pt-6">
        <div key={step} className="kpt-pop flex-1">
          <p className="text-base leading-6 text-ink">{current.body}</p>
          {step === 0 ? (
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Pin legend">
              <span className="kp-glass flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold">
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border-2 border-muted"
                />
                Not visited
              </span>
              <span className="kp-glass flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold">
                <FlagIcon className="size-4 text-[#2f4aa8]" />
                Planned
              </span>
              <span className="kp-glass flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold">
                <CheckIcon className="size-4 text-[#1f8a4d]" strokeWidth={3} />
                Visited
              </span>
            </div>
          ) : null}
        </div>

        <p className="sr-only">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="mb-1 flex">
          {STEPS.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Go to step ${i + 1}: ${item.title}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className="kp-hit grid h-11 min-w-6 place-items-center pr-1.5"
            >
              <span
                className={`h-2 rounded-full transition-all ${
                  i === step ? "w-7 bg-postal" : "w-2 bg-[#785a1e]/25"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? finish() : setStep(step + 1))}
          className="flex h-[62px] w-full items-center justify-center gap-2 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          {last ? "Start collecting" : "Next"}
        </button>
      </section>
    </main>
  );
}
