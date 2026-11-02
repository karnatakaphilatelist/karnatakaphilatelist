import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ShareProgressSheet } from "@/components/passport/ShareProgressSheet";
import { StampDetailSheet } from "@/components/passport/StampDetailSheet";
import { polyfillDialog } from "@/test-helpers-dialog";

vi.mock("@/lib/stamp-image", () => ({ stampImageUrl: () => null }));
beforeAll(polyfillDialog);
afterEach(cleanup);

describe("ShareProgressSheet", () => {
  it("previews the card and shares on request", () => {
    const onShare = vi.fn();
    render(<ShareProgressSheet open stamped={12} total={99} stateName="Karnataka" onShare={onShare} onClose={vi.fn()} />);
    expect(screen.getByText("of 99 stamped in Karnataka")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(onShare).toHaveBeenCalled();
  });
});

describe("StampDetailSheet", () => {
  it("shows the office and when it was collected", () => {
    render(
      <StampDetailSheet
        office={{ id: 3, name: "Udupi HO", pincode: "576101", district: "Udupi", state: "KA", lat: null, lng: null, stampImagePath: null }}
        visit={{ officeId: 3, visitedAt: "2 Nov 2026", note: "Lovely", photoPath: null, isPublic: false }}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Collected 2 Nov 2026/)).toBeTruthy();
    expect(screen.getByText("Lovely")).toBeTruthy();
  });
});
