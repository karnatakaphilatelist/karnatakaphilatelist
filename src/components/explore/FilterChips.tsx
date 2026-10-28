import type { OfficeStatus } from "@/types";

export type StatusFilter = "all" | OfficeStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unvisited", label: "Not visited" },
  { value: "planned", label: "Planned" },
  { value: "visited", label: "Visited" },
];

interface FilterChipsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div role="group" aria-label="Filter by status" className="-mx-1 flex flex-wrap">
      {FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          // The outer button keeps a 44px touch target around the smaller visual pill.
          <button
            key={filter.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className="min-h-11 px-1"
          >
            <span
              className={`block rounded-sm border px-3 py-1.5 kp-label ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong bg-white text-ink"
              }`}
            >
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
