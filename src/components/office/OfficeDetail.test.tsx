import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const stampImage = vi.hoisted(() => ({
  stampImageUrl: vi.fn((): string | null => null),
}));
vi.mock("@/lib/stamp-image", () => stampImage);

afterEach(cleanup);

beforeEach(() => {
  stampImage.stampImageUrl.mockReset().mockReturnValue(null);
});

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
  function renderWithAbout(
    aboutPlace: string | null,
    stampImagePath: string | null = null
  ) {
    const office: OfficeWithStatus = {
      id: 1,
      name: "Belur SO",
      pincode: "573115",
      district: "Hassan",
      state: "KA",
      lat: 13.16,
      lng: 75.86,
      stampImagePath,
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

  it("shows nothing when the office has no note and no postmark", () => {
    renderWithAbout(null);
    expect(screen.queryByText("About this place")).toBeNull();
  });

  it("shows the real postmark specimen beside the note when the office has one", () => {
    stampImage.stampImageUrl.mockReturnValue(
      "https://example.supabase.co/storage/v1/object/public/office-stamps/belur.webp"
    );
    renderWithAbout("A postmark showing Darpana Sundari.", "belur.webp");
    expect(screen.getByText("About this place")).toBeTruthy();
    expect(screen.getByAltText("Belur SO postmark design")).toBeTruthy();
    expect(screen.getByText("Postmark")).toBeTruthy();
  });

  it("still shows the section from the note alone when the postmark image fails to resolve", () => {
    stampImage.stampImageUrl.mockReturnValue(null);
    renderWithAbout("A postmark showing Darpana Sundari.", "belur.webp");
    expect(
      screen.getByText("A postmark showing Darpana Sundari.")
    ).toBeTruthy();
    expect(screen.queryByAltText("Belur SO postmark design")).toBeNull();
  });
});
