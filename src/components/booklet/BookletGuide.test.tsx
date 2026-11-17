import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BookletGuide } from "@/components/booklet/BookletGuide";
import { BOOKLET_OUTLETS, BUREAU_EMAIL } from "@/lib/booklet";

afterEach(cleanup);

describe("BookletGuide", () => {
  it("lists every outlet with a directions link", () => {
    render(<BookletGuide />);
    for (const outlet of BOOKLET_OUTLETS) {
      const link = screen.getByRole("link", {
        name: `Directions to ${outlet.name}`,
      });
      expect(link.getAttribute("href")).toContain("google.com/maps");
    }
  });

  it("offers an email to the bureau and a way back to the map", () => {
    render(<BookletGuide />);
    const mail = screen.getByRole("link", { name: "Email the bureau" });
    expect(mail.getAttribute("href")).toContain(`mailto:${BUREAU_EMAIL}`);
    expect(
      screen.getByRole("link", { name: "Open the map" }).getAttribute("href")
    ).toBe("/explore");
  });

  it("says it is independent of India Post", () => {
    render(<BookletGuide />);
    expect(screen.getByText(/independent project/i)).toBeTruthy();
  });
});
