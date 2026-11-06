"use client";

import { COMING_SOON_STATES, stateName, type StateOption } from "@/lib/states";

interface StateSwitcherProps {
  states: StateOption[];
  value: string;
  onChange: (code: string) => void;
  idSuffix: string;
  /** Style for sitting on a red surface: translucent white with white text. */
  onRed?: boolean;
  /** Phone panel title: the state name in bold with no frame. */
  title?: boolean;
}

/** Pick which state's post offices to browse. States still being added show as coming soon. */
export function StateSwitcher({
  states,
  value,
  onChange,
  idSuffix,
  onRed = false,
  title = false,
}: StateSwitcherProps) {
  const id = `state-${idSuffix}`;
  const soon = COMING_SOON_STATES.filter(
    (code) => !states.some((state) => state.code === code)
  );
  if (title) {
    // Looks like a bold heading with a chevron; the real select sits invisibly on top so it stays accessible.
    return (
      <div className="relative inline-flex min-h-11 items-center gap-1.5">
        <span
          aria-hidden="true"
          className="text-xl font-bold leading-6 tracking-tight text-ink"
        >
          {states.find((state) => state.code === value)?.name ??
            stateName(value)}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4 text-ink"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
        <label htmlFor={id} className="sr-only">
          State
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name} · {state.count} post offices
            </option>
          ))}
          {soon.map((code) => (
            <option key={code} value={code} disabled>
              {stateName(code)} · coming soon
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className={`relative flex items-center ${title ? "w-fit" : ""}`}>
      <label htmlFor={id} className="sr-only">
        State
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 w-full appearance-none ${
          title
            ? "bg-transparent py-0 pl-0 pr-6 text-xl font-bold tracking-tight text-ink"
            : "rounded-full border py-0 pl-4 pr-11 text-sm font-semibold"
        } ${
          title
            ? ""
            : onRed
            ? "border-white/30 bg-white/15 text-white [&>option]:text-ink"
            : "border-line-strong bg-paper text-ink"
        }`}
      >
        {states.map((state) => (
          <option key={state.code} value={state.code}>
            {title ? state.name : `${state.name} · ${state.count} post offices`}
          </option>
        ))}
        {soon.map((code) => (
          <option key={code} value={code} disabled>
            {stateName(code)} · coming soon
          </option>
        ))}
      </select>
      {/* The browser's own arrow sits at an odd height and edge, so it is replaced with one we can centre. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute ${
          title ? "right-0" : "right-4"
        } top-1/2 size-4 -translate-y-1/2 ${
          onRed ? "text-white" : "text-muted"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 7.5 5 5 5-5" />
      </svg>
    </div>
  );
}
