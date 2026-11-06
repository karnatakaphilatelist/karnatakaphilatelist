import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeTour } from "@/components/welcome/WelcomeTour";
import { ONBOARDED_KEY } from "@/lib/constants";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, prefetch: vi.fn() }) }));
vi.mock("@/components/map/OfficeMap", () => ({}));

describe("WelcomeTour", () => {
  afterEach(cleanup);
  beforeEach(() => {
    replace.mockClear();
    localStorage.clear();
  });

  it("walks through three steps and finishes on the map", () => {
    render(<WelcomeTour />);
    expect(screen.getByRole("heading", { name: "Find it." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Visit it." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Start collecting" }));
    expect(replace).toHaveBeenCalledWith("/explore");
    expect(localStorage.getItem(ONBOARDED_KEY)).toBe("true");
  });

  it("moves between steps with the dots", () => {
    render(<WelcomeTour />);
    fireEvent.click(screen.getByRole("button", { name: /go to step 3/i }));
    expect(screen.getByRole("heading", { name: "Stamp it." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /go to step 1/i }));
    expect(screen.getByRole("heading", { name: "Find it." })).toBeTruthy();
  });

  it("can be skipped", () => {
    render(<WelcomeTour />);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(replace).toHaveBeenCalledWith("/explore");
  });
});
