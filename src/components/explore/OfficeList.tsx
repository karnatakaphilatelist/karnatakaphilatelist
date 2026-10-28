import { StatusBadge } from "@/components/office/StatusBadge";
import { StampThumb } from "@/components/office/StampThumb";
import { formatDistance } from "@/lib/geo";
import type { OfficeWithStatus } from "@/types";

interface OfficeListProps {
  offices: OfficeWithStatus[];
  selectedId: number | null;
  onSelect: (officeId: number) => void;
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
    <ul className="px-3 pb-4">
      {offices.map((office) => {
        const selected = office.id === selectedId;
        return (
          <li key={office.id}>
            <button
              type="button"
              onClick={() => onSelect(office.id)}
              aria-current={selected ? "true" : undefined}
              className={`mb-1 flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-[1.5px] px-2 py-2.5 text-left ${
                selected ? "border-postal bg-postal-soft/50" : "border-transparent"
              }`}
            >
              <StampThumb path={office.stampImagePath} status={office.status} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold">
                  {office.name}
                </span>
                <span className="block truncate text-sm text-muted">
                  {office.district}
                  {office.pincode ? ` · ${office.pincode}` : ""}
                  {office.distanceKm !== null
                    ? ` · ${formatDistance(office.distanceKm)}`
                    : ""}
                </span>
              </span>
              <StatusBadge status={office.status} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
