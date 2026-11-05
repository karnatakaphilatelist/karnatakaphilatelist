import {
  FilterChips,
  type StatusFilter,
} from "@/components/explore/FilterChips";
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
      <div className="relative" data-tour={`search-${idSuffix}`}>
        <label htmlFor={inputId} className="sr-only">
          Search by post office, district or pincode
        </label>
        <SearchIcon className="pointer-events-none absolute left-4.5 top-4 size-5 text-muted" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, district or pincode"
          className="h-13 w-full rounded-full border border-line bg-white pl-12 pr-4 text-base shadow-[0_1px_2px_rgb(22_32_79/0.1),0_10px_22px_-10px_rgb(22_32_79/0.35)]"
        />
      </div>
      <FilterChips value={filter} onChange={onFilterChange} tourId={`filters-${idSuffix}`} />
    </>
  );
}
