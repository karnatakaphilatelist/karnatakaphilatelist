"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { CheckIcon } from "@/components/ui/icons";
import { stateName, type StateOption } from "@/lib/states";

/** How far a horizontal drag has to travel, staying mostly horizontal, to count as a swipe. */
const SWIPE_COMMIT_PX = 56;

/**
 * The big "KARNATAKA ▾" heading on the passport header, and how you change it.
 * Used to be a plain <select>: its closed state (this same big uppercase
 * heading) looked right, but the *open* option list is rendered by the OS,
 * not by us — no amount of CSS gets a branded, on-model list out of a native
 * <select>, which is exactly the odd blue/pink native-picker look this
 * replaces. The open list is now our own Sheet, and the whole header band is
 * also swipeable left/right between the live states, alongside the tap.
 */
export function StateSwitcher({
  states,
  soonStates,
  stateCode,
  choose,
}: {
  states: StateOption[];
  soonStates: string[];
  stateCode: string;
  choose: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = states.find((state) => state.code === stateCode) ?? states[0];
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  function step(direction: 1 | -1) {
    const index = states.findIndex((state) => state.code === stateCode);
    if (index === -1 || states.length < 2) return;
    const next = states[(index + direction + states.length) % states.length];
    choose(next.code);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const origin = swipeStart.current;
    swipeStart.current = null;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = Math.abs(event.clientY - origin.y);
    if (Math.abs(dx) < SWIPE_COMMIT_PX || dy > Math.abs(dx) * 0.6) return;
    step(dx < 0 ? 1 : -1);
  }

  return (
    <>
      <div
        className="relative mt-3 flex h-14 touch-pan-y items-center"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="-ml-0.5 h-14 w-full truncate text-left text-[clamp(30px,10vw,48px)] font-medium uppercase tracking-[0.01em] text-white"
        >
          {current?.name ?? stateName(stateCode)}
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 grid size-9 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-4 text-[#f7c96b]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </span>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Choose a state">
        <div className="flex flex-col gap-2">
          {states.map((state) => {
            const selected = state.code === stateCode;
            return (
              <button
                key={state.code}
                type="button"
                onClick={() => {
                  choose(state.code);
                  setOpen(false);
                }}
                aria-pressed={selected}
                className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left ${
                  selected
                    ? "border-postal bg-postal/10 text-ink"
                    : "border-line text-ink"
                }`}
              >
                <span>
                  <span className="font-display text-lg font-bold">
                    {state.name}
                  </span>
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    {state.count} offices
                  </span>
                </span>
                {selected && <CheckIcon className="size-5 text-postal" />}
              </button>
            );
          })}
          {soonStates.map((code) => (
            <div
              key={code}
              className="flex min-h-14 items-center justify-between rounded-2xl border border-line/60 px-4 text-left opacity-50"
            >
              <span className="font-display text-lg font-bold">
                {stateName(code)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}
