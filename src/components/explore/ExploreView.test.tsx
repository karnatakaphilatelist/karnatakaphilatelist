import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExploreView } from "@/components/explore/ExploreView";
import type { PostOffice, Visit } from "@/types";

vi.mock("@/lib/env", () => ({
  env: { supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "key" },
}));
// Leaflet needs a real browser; the map is not what these tests are about.
vi.mock("@/components/map/LazyOfficeMap", () => ({ LazyOfficeMap: () => null }));
vi.mock("@/components/office/VisitDialog", () => ({ VisitDialog: () => null }));
vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const visits = vi.hoisted(() => ({ current: {} as Record<number, Visit> }));
vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({
    visits: visits.current,
    plannedIds: new Set<number>(),
    markVisited: vi.fn(),
    removeVisit: vi.fn(),
    togglePlanned: vi.fn(),
  }),
}));

const office = (id: number, name: string): PostOffice => ({
  id,
  name,
  pincode: `5600${id}`,
  district: "Bengaluru Urban",
  lat: 12.9,
  lng: 77.5,
  stampImagePath: null,
});

const offices = [office(1, "Alpha GPO"), office(2, "Beta HPO")];

afterEach(() => {
  cleanup();
  visits.current = {};
});

const detailCard = () => screen.queryByRole("region", { name: /details$/ });
/** The controls are rendered twice (desktop and phone), so take the first match. */
const chip = (name: string) => screen.getAllByRole("button", { name })[0];

describe("ExploreView selection", () => {
  it("opens the detail card for the office that was tapped", () => {
    render(<ExploreView offices={offices} initialSelectedId={null} />);
    expect(detailCard()).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Alpha GPO/ }));
    expect(detailCard()?.getAttribute("aria-label")).toBe("Alpha GPO details");
  });

  it("opens the office named in the link", () => {
    render(<ExploreView offices={offices} initialSelectedId={2} />);
    expect(detailCard()?.getAttribute("aria-label")).toBe("Beta HPO details");
  });

  it("closes the card when a filter hides the office, and does not reopen it when the filter is cleared", () => {
    render(<ExploreView offices={offices} initialSelectedId={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Alpha GPO/ }));
    expect(detailCard()).not.toBeNull();

    // Nothing is visited yet, so "Visited" hides Alpha GPO.
    fireEvent.click(chip("Visited"));
    expect(detailCard()).toBeNull();

    fireEvent.click(chip("All"));
    expect(screen.getByRole("button", { name: /Alpha GPO/ })).toBeDefined();
    expect(detailCard()).toBeNull();
  });

  it("keeps the card open while the office still matches the filter", () => {
    render(<ExploreView offices={offices} initialSelectedId={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Alpha GPO/ }));

    fireEvent.click(chip("Not visited"));
    expect(detailCard()?.getAttribute("aria-label")).toBe("Alpha GPO details");
  });

  it("ignores a link to an office that does not exist", () => {
    render(<ExploreView offices={offices} initialSelectedId={999} />);
    expect(detailCard()).toBeNull();
  });
});
