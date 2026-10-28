import { FilterChips, type StatusFilter } from "@/components/explore/FilterChips";
import { SearchIcon } from "@/components/ui/icons";

interface ExploreControlsProps {
  /** Distinguishes the input id when the controls are rendered twice (phone and desktop). */
  idSuffix: string;
  query: string;
  onQueryChange: (query: string) => void;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

/** Search box and status filter chips. */
export function ExploreControls({
  idSuffix,
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: ExploreControlsProps) {
  const inputId = `post-office-search-${idSuffix}`;
  return (
    <>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search by post office, district or pincode
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search post office, district or pincode"
          className="h-12 w-full rounded-sm border border-line-strong bg-paper pl-11 pr-3 text-base"
        />
      </div>
      <FilterChips value={filter} onChange={onFilterChange} />
    </>
  );
}
