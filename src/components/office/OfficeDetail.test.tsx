import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfficeDetail } from "@/components/office/OfficeDetail";
import type { OfficeWithStatus, Visit } from "@/types";

const mockVisits = vi.hoisted(() => ({ current: {} as Record<number, Visit> }));

vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({
    visits: mockVisits.current,
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
  mockVisits.current = {};
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

  it("shows the aboutPlace text when the office has one", () => {
    renderWithAbout("A postmark showing Darpana Sundari.");
    expect(screen.getByText("About this place")).toBeTruthy();
    expect(
      screen.getByText("A postmark showing Darpana Sundari.")
    ).toBeTruthy();
  });

  it("shows fallback about text when the office has no aboutPlace", () => {
    renderWithAbout(null);
    expect(screen.getByText("About this place")).toBeTruthy();
    expect(
      screen.getByText(/A philatelic post office in Hassan district/)
    ).toBeTruthy();
  });

  it("shows aboutPlace text even when a stamp image is present", () => {
    stampImage.stampImageUrl.mockReturnValue(
      "https://example.supabase.co/storage/v1/object/public/office-stamps/belur.webp"
    );
    renderWithAbout("A postmark showing Darpana Sundari.", "belur.webp");
    expect(screen.getByText("About this place")).toBeTruthy();
    expect(
      screen.getByText("A postmark showing Darpana Sundari.")
    ).toBeTruthy();
  });

  it("shows fallback about text when stamp image fails to resolve", () => {
    stampImage.stampImageUrl.mockReturnValue(null);
    renderWithAbout(null, "belur.webp");
    expect(
      screen.getByText(/A philatelic post office in Hassan district/)
    ).toBeTruthy();
  });
});

describe("OfficeDetail tabs", () => {
  function baseOffice(overrides: Partial<OfficeWithStatus> = {}): OfficeWithStatus {
    return {
      id: 1,
      name: "Aihole BO",
      pincode: "587124",
      district: "Bagalkot",
      state: "KA",
      lat: 15.87,
      lng: 75.88,
      stampImagePath: null,
      status: "unvisited",
      distanceKm: null,
      ...overrides,
    };
  }

  it("shows the About tab's content by default", () => {
    render(
      <OfficeDetail
        office={baseOffice()}
        onClose={vi.fn()}
        onMarkVisited={vi.fn()}
      />
    );
    expect(screen.getByText("About this place")).toBeTruthy();
  });

  it("switches to the Notes tab and shows the empty state before any visit", () => {
    render(
      <OfficeDetail
        office={baseOffice()}
        onClose={vi.fn()}
        onMarkVisited={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^Notes/ }));
    expect(screen.getByText("No notes yet")).toBeTruthy();
    expect(
      screen.getByText(/stamp your passport to start adding notes/)
    ).toBeTruthy();
  });

  it("shows the visit's own note on the Notes tab, with an edit action", () => {
    mockVisits.current = {
      1: {
        officeId: 1,
        visitedAt: "2026-11-13",
        note: "Counter was open 10am–1pm only.",
        photoPath: null,
        isPublic: false,
      },
    };
    const onEditVisit = vi.fn();
    render(
      <OfficeDetail
        office={baseOffice({ status: "visited" })}
        onClose={vi.fn()}
        onMarkVisited={vi.fn()}
        onEditVisit={onEditVisit}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^Notes/ }));
    expect(
      screen.getByText("Counter was open 10am–1pm only.")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit note & photo" }));
    expect(onEditVisit).toHaveBeenCalledWith(1);
  });

  it("shows an honest placeholder on the Public tab", () => {
    render(
      <OfficeDetail
        office={baseOffice()}
        onClose={vi.fn()}
        onMarkVisited={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Public" }));
    expect(screen.getByText("No public notes yet")).toBeTruthy();
  });
});
