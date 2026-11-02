import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import type { OfficeWithStatus } from "@/types";

vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({ visits: {}, togglePlanned: vi.fn(), removeVisit: vi.fn() }),
}));

vi.mock("@/lib/stamp-image", () => ({ stampImageUrl: () => null }));

afterEach(cleanup);

function renderAt(distanceKm: number | null) {
  const office: OfficeWithStatus = {
    id: 1, name: "Mysuru HO", pincode: "570001", district: "Mysuru", state: "KA",
    lat: 12.3, lng: 76.6, stampImagePath: null, status: "unvisited", distanceKm,
  };
  render(<OfficeDetail office={office} onClose={vi.fn()} onMarkVisited={vi.fn()} onEditVisit={vi.fn()} />);
}

describe("OfficeDetail stamping", () => {
  it("says you are here when within 150 m, and keeps Stamp it enabled", () => {
    renderAt(0.05);
    expect(screen.getByText(/You're here/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Stamp it/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("warns when far away but still allows logging a past visit", () => {
    renderAt(12);
    expect(screen.getByText(/You're 12 km away/)).toBeTruthy();
    expect(screen.getByText(/log a past visit/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Stamp it/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows no banner before location is known", () => {
    renderAt(null);
    expect(screen.queryByText(/You're here/)).toBeNull();
    expect(screen.queryByText(/log a past visit/)).toBeNull();
  });
});
