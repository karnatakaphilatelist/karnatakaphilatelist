"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, MailIcon, NavigationIcon, TargetIcon } from "@/components/ui/icons";
import { ONBOARDED_KEY } from "@/lib/constants";
import { writeJson } from "@/lib/local-storage";
import { isNativeApp } from "@/lib/native";
import "./tour.css";

interface Step {
  title: string;
  body: string;
  art: () => ReactNode;
}

const NAMES = ["Hubballi", "Mysuru", "Mangaluru", "Belagavi", "Hampi", "Udupi", "Coorg", "Bidar"];

function Chip({ name, tone }: { name: string; tone: "paper" | "green" }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
        tone === "green" ? "bg-visited-soft text-visited-ink" : "bg-white text-ink"
      }`}
    >
      {tone === "green" ? <CheckIcon className="size-4" strokeWidth={3} /> : <MailIcon className="size-4" />}
      {name}
    </span>
  );
}

function ChipRow({ reverse = false, offset = 0 }: { reverse?: boolean; offset?: number }) {
  const names = [...NAMES.slice(offset), ...NAMES.slice(0, offset)];
  // Doubled so the loop can slide by exactly half its width.
  return (
    <div className={`kpt-row ${reverse ? "kpt-row--rev" : ""}`} aria-hidden="true">
      {[...names, ...names].map((name, i) => (
        <Chip key={i} name={name} tone={i % 3 === 0 ? "green" : "paper"} />
      ))}
    </div>
  );
}

function FindArt() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-2 overflow-hidden">
      <ChipRow />
      <ChipRow reverse offset={3} />
      <ChipRow offset={5} />
      <div
        className="kpt-pop absolute inset-x-6 bottom-8 flex items-center gap-3 rounded-2xl bg-paper p-3.5 shadow-[0_18px_30px_-12px_rgb(0_0_0/0.45)]"
      >
        <span className="grid size-11 place-items-center rounded-full bg-postal text-white">
          <NavigationIcon className="size-5" />
        </span>
        <div>
          <p className="font-bold text-ink">Nearest post office</p>
          <p className="text-sm text-muted">Tap a pin for directions</p>
        </div>
      </div>
    </div>
  );
}

function StampArt() {
  return (
    <div className="relative grid h-full place-items-center">
      <div
        className="kpt-pop relative h-40 w-64 rounded-xl bg-paper p-4 text-ink shadow-[0_18px_30px_-12px_rgb(0_0_0/0.5)]"
        style={{ "--r": "-3deg" } as React.CSSProperties}
        aria-hidden="true"
      >
        {/* A postcard: address lines on the left, the stamp in the corner, a postmark over the edge. */}
        <div className="mt-14 space-y-2.5">
          <span className="block h-1.5 w-28 rounded-full bg-line-strong" />
          <span className="block h-1.5 w-20 rounded-full bg-line-strong" />
          <span className="block h-1.5 w-24 rounded-full bg-line-strong" />
        </div>
        <span className="kpt-stamp kp-perforated absolute right-4 top-4 grid h-[4.5rem] w-14 place-items-center text-white">
          <TargetIcon className="size-7" />
        </span>
        <span className="kpt-ink absolute right-14 top-8 grid size-[4.5rem] place-items-center rounded-full border-[3px] border-ink/70 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-ink/70">
          Stamped
        </span>
      </div>
    </div>
  );
}

function PassportArt() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex items-center gap-4">
        {[-6, 3, -2].map((r, i) => (
          <div
            key={i}
            className="kpt-pop grid h-28 w-24 place-items-center rounded-lg bg-white shadow-[0_18px_30px_-12px_rgb(0_0_0/0.45)]"
            style={{ "--r": `${r}deg`, animationDelay: `${i * 0.18}s` } as React.CSSProperties}
          >
            <span className="grid size-10 place-items-center rounded-full bg-visited text-white">
              <CheckIcon className="size-5" strokeWidth={3} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: Step[] = [
  {
    title: "Find a post office",
    body: "Every post office in the state is on the map. See what is nearby and which ones you have not been to yet.",
    art: () => <FindArt />,
  },
  {
    title: "Get it stamped",
    body: "Visit in person, ask for the postmark, then tap Stamp it. Add a note or photo if you like.",
    art: () => <StampArt />,
  },
  {
    title: "Fill your passport",
    body: "Each stamp lands in your passport. Watch your count grow, one post office at a time.",
    art: () => <PassportArt />,
  },
];

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
      className="flex h-dvh touch-pan-y flex-col bg-paper"
      onTouchStart={(event) => {
        const t = event.touches[0];
        swipe.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(event) => {
        const t = event.changedTouches[0];
        onTouchEnd(t.clientX, t.clientY);
      }}
    >
      <section className="kp-red relative flex-[1.15] overflow-hidden text-white" aria-label="Illustration">
        <button
          type="button"
          onClick={finish}
          className="absolute right-3 top-3 z-10 min-h-11 rounded-full px-4 text-sm font-semibold text-white"
        >
          Skip
        </button>
        <div key={step} className="size-full">
          {current.art()}
        </div>
      </section>

      <section className="flex flex-1 flex-col px-4 pb-8 pt-7">
        <div key={step} className="kpt-pop flex-1">
          <h1 className="text-5xl font-medium uppercase leading-[52px] tracking-[0.01em] text-ink">
            {current.title}
          </h1>
          <p className="mt-3 text-base leading-6 text-muted">{current.body}</p>
        </div>

        <p className="sr-only">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="mb-3 flex justify-center">
          {STEPS.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Go to step ${i + 1}: ${item.title}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className="grid h-9 min-w-6 place-items-center px-1"
            >
              <span
                className={`h-2 rounded-full transition-all ${
                  i === step ? "w-7 bg-postal" : "w-2 bg-line-strong"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? finish() : setStep(step + 1))}
          className="min-h-[62px] w-full rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.12em] text-white"
        >
          {last ? "Start collecting" : "Next"}
        </button>
      </section>
    </main>
  );
}
