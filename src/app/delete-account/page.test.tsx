import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DeleteAccountPage from "@/app/delete-account/page";
import { CONTACT_EMAIL } from "@/lib/constants";

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
