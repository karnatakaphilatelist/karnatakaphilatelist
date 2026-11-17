import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LearnGuide } from "@/components/learn/LearnGuide";
import { BOOKLET_OUTLETS, BUREAU_EMAIL } from "@/lib/booklet";

afterEach(cleanup);

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("LearnGuide", () => {
  it("lists every outlet with a directions link", () => {
    render(<LearnGuide />);
    for (const outlet of BOOKLET_OUTLETS) {
      const link = screen.getByRole("link", {
        name: `Directions to ${outlet.name}`,
      });
      expect(link.getAttribute("href")).toContain("google.com/maps");
    }
  });

  it("offers an email to the bureau and a way back to the map", () => {
    render(<LearnGuide />);
    const mail = screen.getByRole("link", { name: "Email the bureau" });
    expect(mail.getAttribute("href")).toContain(`mailto:${BUREAU_EMAIL}`);
    expect(
      screen.getByRole("link", { name: "Open the map" }).getAttribute("href")
    ).toBe("/explore");
  });

  it("can be shared from the top and the bottom", () => {
    render(<LearnGuide />);
    expect(
      screen.getAllByRole("button", { name: "Share this guide" })
    ).toHaveLength(2);
  });

  it("says it is independent of India Post", () => {
    render(<LearnGuide />);
    expect(screen.getByText(/independent project/i)).toBeTruthy();
  });
});
