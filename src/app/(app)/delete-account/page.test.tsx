import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DeleteAccountPage from "@/app/(app)/delete-account/page";
import { CONTACT_EMAIL } from "@/lib/constants";

// LegalPage (the page's shared wrapper) uses useRouter for its back button.
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

describe("delete-account page", () => {
  afterEach(cleanup);

  it("explains the in-app steps, the email route, and what is removed", () => {
    render(<DeleteAccountPage />);

    expect(
      screen.getByRole("heading", { name: "Delete your Philatrail account" })
    ).toBeTruthy();
    expect(screen.getByText("Delete my account")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "What is deleted" })
    ).toBeTruthy();

    const mail = screen.getByRole("link", { name: CONTACT_EMAIL });
    expect(mail.getAttribute("href")).toBe(`mailto:${CONTACT_EMAIL}`);
  });
});
