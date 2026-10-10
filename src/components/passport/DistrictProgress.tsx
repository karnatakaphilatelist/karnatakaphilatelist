import type { PostOffice, Visit } from "@/types";

interface DistrictRow {
  district: string;
  visited: number;
  total: number;
}

/** Counts offices and visits per district, fullest districts first. */
function summariseDistricts(
  offices: PostOffice[],
  visits: Record<number, Visit>,
): DistrictRow[] {
  const rows = new Map<string, DistrictRow>();
  for (const office of offices) {
    const row = rows.get(office.district) ?? {
      district: office.district,
      visited: 0,
      total: 0,
    };
    row.total += 1;
    if (visits[office.id]) row.visited += 1;
    rows.set(office.district, row);
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.visited / b.total - a.visited / a.total || a.district.localeCompare(b.district),
  );
}

interface DistrictProgressProps {
  offices: PostOffice[];
  visits: Record<number, Visit>;
}

export function DistrictProgress({ offices, visits }: DistrictProgressProps) {
  const rows = summariseDistricts(offices, visits);

  return (
    <ul className="space-y-3">
      {rows.map(({ district, visited, total }) => {
        const complete = visited === total;
        return (
          <li key={district}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">{district}</span>
              <span className={complete ? "font-bold text-visited-ink" : "text-muted"}>
                {visited} of {total}
                {complete ? " · complete" : ""}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${district} progress`}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={visited}
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand"
            >
              <div
                className="h-full rounded-full bg-visited"
                style={{ width: `${(visited / total) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
