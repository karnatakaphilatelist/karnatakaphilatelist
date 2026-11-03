"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CheckIcon, MailIcon, NavigationIcon, TargetIcon } from "@/components/ui/icons";
import { ONBOARDED_KEY } from "@/lib/constants";
import { writeJson } from "@/lib/local-storage";
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
        className="kpt-pop absolute inset-x-8 bottom-6 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_18px_30px_-12px_rgb(0_0_0/0.45)]"
        style={{ "--r": "-2deg" } as React.CSSProperties}
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
      <div className="relative">
        <div className="grid h-36 w-44 place-items-center rounded-lg bg-white/90 shadow-[0_18px_30px_-12px_rgb(0_0_0/0.5)]">
          <MailIcon className="size-12 text-muted" />
        </div>
        <span className="kpt-ripple absolute inset-0 -m-6 rounded-full border-2 border-white/70" />
        <span className="kpt-stamp absolute -bottom-5 -right-6 grid size-24 place-items-center rounded-lg bg-white text-ink shadow-[0_14px_24px_-10px_rgb(0_0_0/0.5)]">
          <TargetIcon className="size-10" />
        </span>
        <span className="kpt-ink absolute -left-5 -top-4 grid size-20 place-items-center rounded-full border-[3px] border-white text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-white">
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

  function finish() {
    writeJson(ONBOARDED_KEY, true);
    router.replace("/explore");
  }

  return (
    <main className="flex h-dvh flex-col bg-paper">
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

      <section className="flex flex-1 flex-col px-7 pb-8 pt-7">
        <div key={step} className="kpt-pop flex-1">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink">
            {current.title}
          </h1>
          <p className="mt-3 text-base leading-6 text-muted">{current.body}</p>
        </div>

        <p className="sr-only">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="mb-5 flex justify-center gap-2" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-7 bg-postal" : "w-2 bg-line-strong"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? finish() : setStep(step + 1))}
          className="min-h-13 w-full rounded-full bg-postal text-base font-bold text-white"
        >
          {last ? "Start collecting" : "Next"}
        </button>
      </section>
    </main>
  );
}
