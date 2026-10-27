import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressStrip } from "@/components/explore/ProgressStrip";

afterEach(cleanup);

const handlers = { onFindNext: vi.fn(), onSignIn: vi.fn() };

describe("ProgressStrip", () => {
  it("shows nothing while the session is loading", () => {
    const { container } = render(
      <ProgressStrip signedIn={null} firstName={null} stamped={0} total={99} {...handlers} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows nothing to a guest with no stamps", () => {
    const { container } = render(
      <ProgressStrip signedIn={false} firstName={null} stamped={0} total={99} {...handlers} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("offers a guest with stamps a way to keep them", () => {
    render(<ProgressStrip signedIn={false} firstName={null} stamped={3} total={99} {...handlers} />);
    expect(screen.getByText(/stamped 3 as a guest/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(handlers.onSignIn).toHaveBeenCalled();
  });

  it("greets a signed-in person by first name with their progress", () => {
    render(<ProgressStrip signedIn firstName="Asha" stamped={12} total={99} {...handlers} />);
    expect(screen.getByText("Namaskara, Asha")).toBeDefined();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("12");
    expect(bar.getAttribute("aria-valuemax")).toBe("99");
    fireEvent.click(screen.getByRole("button", { name: "Find next" }));
    expect(handlers.onFindNext).toHaveBeenCalled();
  });

  it("greets without a name when only an email is known", () => {
    render(<ProgressStrip signedIn firstName={null} stamped={0} total={99} {...handlers} />);
    expect(screen.getByText("Namaskara")).toBeDefined();
  });

  it("drops the next-step button once every post office is stamped", () => {
    render(<ProgressStrip signedIn firstName="Asha" stamped={99} total={99} {...handlers} />);
    expect(screen.queryByRole("button", { name: "Find next" })).toBeNull();
  });
});
