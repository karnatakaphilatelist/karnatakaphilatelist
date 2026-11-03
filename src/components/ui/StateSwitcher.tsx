"use client";

import { COMING_SOON_STATES, stateName, type StateOption } from "@/lib/states";

interface StateSwitcherProps {
  states: StateOption[];
  value: string;
  onChange: (code: string) => void;
  idSuffix: string;
  /** Style for sitting on a red surface: translucent white with white text. */
  onRed?: boolean;
}

/** Pick which state's post offices to browse. States still being added show as coming soon. */
export function StateSwitcher({
  states,
  value,
  onChange,
  idSuffix,
  onRed = false,
}: StateSwitcherProps) {
  const id = `state-${idSuffix}`;
  const soon = COMING_SOON_STATES.filter(
    (code) => !states.some((state) => state.code === code)
  );
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        State
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 w-full rounded-full border px-4 text-sm font-semibold ${
          onRed
            ? "border-white/30 bg-white/15 text-white [&>option]:text-ink"
            : "border-line-strong bg-paper text-ink"
        }`}
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
