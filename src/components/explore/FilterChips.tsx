import { CheckIcon, FlagIcon } from "@/components/ui/icons";
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
  /** Marks the row for the app walkthrough. */
  tourId?: string;
}

export function FilterChips({ value, onChange, tourId }: FilterChipsProps) {
  return (
    <div
      role="group"
      data-tour={tourId}
      aria-label="Filter by status"
      className="-mx-4 px-3 flex flex-nowrap overflow-x-auto md:flex-wrap md:overflow-visible [scrollbar-width:none]"
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          // The outer button keeps a 44px touch target around the smaller visual pill.
          <button
            key={filter.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className="min-h-11 shrink-0 px-1"
          >
            <span
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] ${
                active
                  ? "bg-[#f3e2bd] font-bold text-ink shadow-[inset_0_0_0_1.5px_#16204f,0_2px_8px_rgb(0_0_0/0.12)]"
                  : "kp-glass font-semibold text-ink"
              }`}
            >
              {filter.value === "unvisited" ? (
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border-2 border-muted"
                />
              ) : null}
              {filter.value === "planned" ? (
                <FlagIcon className="size-4 text-[#2f4aa8]" />
              ) : null}
              {filter.value === "visited" ? (
                <CheckIcon className="size-4 text-[#1f8a4d]" strokeWidth={3} />
              ) : null}
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
