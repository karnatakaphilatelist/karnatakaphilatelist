import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StampedSheet } from "@/components/office/StampedSheet";
import { polyfillDialog } from "@/test-helpers-dialog";
import type { OfficeWithStatus } from "@/types";

beforeAll(polyfillDialog);
vi.mock("@/lib/stamp-image", () => ({ stampImageUrl: () => null }));

afterEach(cleanup);

const office: OfficeWithStatus = {
  id: 7, name: "Hubballi HO", pincode: "580020", district: "Dharwad", state: "KA",
  lat: 15.36, lng: 75.12, stampImagePath: null, status: "visited", distanceKm: null,
};

describe("StampedSheet", () => {
  it("celebrates the stamp and shows progress", () => {
    render(<StampedSheet office={office} collected={4} total={99} onClose={vi.fn()} onAddNote={vi.fn()} />);
    expect(screen.getByText("Hubballi HO")).toBeTruthy();
    expect(screen.getByText("4 of 99 in your passport")).toBeTruthy();
  });

  it("opens the note dialog for this office after closing", () => {
    const onClose = vi.fn();
    const onAddNote = vi.fn();
    render(<StampedSheet office={office} collected={1} total={99} onClose={onClose} onAddNote={onAddNote} />);
    fireEvent.click(screen.getByRole("button", { name: "Add note and photo" }));
    expect(onClose).toHaveBeenCalled();
    expect(onAddNote).toHaveBeenCalledWith(7);
  });

  it("renders nothing inside when there is no office", () => {
    render(<StampedSheet office={null} collected={0} total={0} onClose={vi.fn()} onAddNote={vi.fn()} />);
    expect(screen.queryByText("Done")).toBeNull();
  });
});
