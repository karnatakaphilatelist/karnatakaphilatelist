import { CheckIcon, FlagIcon } from "@/components/ui/icons";
import { formatDistance } from "@/lib/geo";
import type { OfficeStatus, OfficeWithStatus } from "@/types";

interface OfficeListProps {
  offices: OfficeWithStatus[];
  selectedId: number | null;
  onSelect: (officeId: number) => void;
}

/** Status mark of the list: empty ring (not visited), flag (planned) or filled green check (stamped). */
function StatusMark({ status }: { status: OfficeStatus }) {
  if (status === "visited") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1f8a4d] text-white">
        <CheckIcon className="size-[18px]" strokeWidth={3.2} />
        <span className="sr-only">Stamped</span>
      </span>
    );
  }
  if (status === "planned") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#785a1e]/10 text-[#2f4aa8]">
        <FlagIcon className="size-[18px]" />
        <span className="sr-only">Planned</span>
      </span>
    );
  }
  return (
    <span className="size-9 shrink-0 rounded-full border-2 border-[#16204f]/25">
      <span className="sr-only">Not visited</span>
    </span>
  );
}

export function OfficeList({ offices, selectedId, onSelect }: OfficeListProps) {
  if (offices.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-muted">
        No post offices match. Try a different search or filter.
      </p>
    );
  }

  return (
    <ul className="px-4 pb-4">
      {offices.map((office) => {
        const selected = office.id === selectedId;
        return (
          <li
            key={office.id}
            className="border-b border-[#785a1e]/12 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onSelect(office.id)}
              aria-current={selected ? "true" : undefined}
              className={`flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl px-0 py-3 text-left ${
                selected ? "bg-postal/5" : ""
              }`}
            >
              <StatusMark status={office.status} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold">
                  {office.name}
                </span>
                <span className="flex items-center gap-2 truncate text-sm text-muted">
                  {office.district}
                  {office.distanceKm !== null ? (
                    <>
                      <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
                      <span className="font-mono text-[13px] font-bold uppercase tracking-[0.04em]">
                        {formatDistance(office.distanceKm)}
                      </span>
                    </>
                  ) : office.pincode ? (
                    <>
                      <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
                      <span className="font-mono text-[13px] tracking-[0.06em]">
                        {office.pincode}
                      </span>
                    </>
                  ) : null}
                </span>
              </span>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
