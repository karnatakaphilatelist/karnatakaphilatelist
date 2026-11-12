import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import type { OfficeWithStatus } from "@/types";

vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({
    visits: {},
    togglePlanned: vi.fn(),
    removeVisit: vi.fn(),
  }),
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/lib/stamp-image", () => ({ stampImageUrl: () => null }));

afterEach(cleanup);

function renderAt(distanceKm: number | null) {
  const office: OfficeWithStatus = {
    id: 1,
    name: "Mysuru HO",
    pincode: "570001",
    district: "Mysuru",
    state: "KA",
    lat: 12.3,
    lng: 76.6,
    stampImagePath: null,
    status: "unvisited",
    distanceKm,
  };
  render(
    <OfficeDetail
      office={office}
      onClose={vi.fn()}
      onMarkVisited={vi.fn()}
      onEditVisit={vi.fn()}
    />
  );
}

describe("OfficeDetail stamping", () => {
  it("says you are here when within 150 m, and keeps Stamp it enabled", () => {
    renderAt(0.05);
    expect(screen.getByText(/You're here/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Stamp it/ }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it("warns when far away but still allows logging a past visit", () => {
    renderAt(12);
    expect(screen.getByText(/You're 12 km away/)).toBeTruthy();
    expect(screen.getByText(/log a past visit/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Stamp it/ }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it("shows no banner before location is known", () => {
    renderAt(null);
    expect(screen.queryByText(/You're here/)).toBeNull();
    expect(screen.queryByText(/log a past visit/)).toBeNull();
  });
});

describe("OfficeDetail distance check", () => {
  it("offers to check the distance when location is unknown", () => {
    const office: OfficeWithStatus = {
      id: 1,
      name: "Mysuru HO",
      pincode: "570001",
      district: "Mysuru",
      state: "KA",
      lat: 12.3,
      lng: 76.6,
      stampImagePath: null,
      status: "unvisited",
      distanceKm: null,
    };
    const onCheck = vi.fn();
    render(
      <OfficeDetail
        office={office}
        onClose={vi.fn()}
        onMarkVisited={vi.fn()}
        onEditVisit={vi.fn()}
        onCheckDistance={onCheck}
      />
    );
    screen.getByRole("button", { name: /Check if you're here/ }).click();
    expect(onCheck).toHaveBeenCalled();
  });
});

describe("OfficeDetail about this place", () => {
  function renderWithAbout(aboutPlace: string | null) {
    const office: OfficeWithStatus = {
      id: 1,
      name: "Belur SO",
      pincode: "573115",
      district: "Hassan",
      state: "KA",
      lat: 13.16,
      lng: 75.86,
      stampImagePath: null,
      aboutPlace,
      status: "unvisited",
      distanceKm: null,
    };
    render(
      <OfficeDetail office={office} onClose={vi.fn()} onMarkVisited={vi.fn()} />
    );
  }

  it("shows the note when the office has one", () => {
    renderWithAbout("A postmark showing Darpana Sundari.");
    expect(screen.getByText("About this place")).toBeTruthy();
    expect(
      screen.getByText("A postmark showing Darpana Sundari.")
    ).toBeTruthy();
  });

  it("shows nothing when the office has no note", () => {
    renderWithAbout(null);
    expect(screen.queryByText("About this place")).toBeNull();
  });
});
