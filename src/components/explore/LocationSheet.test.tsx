import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LocationSheet } from "@/components/explore/LocationSheet";
import { polyfillDialog } from "@/test-helpers-dialog";

beforeAll(polyfillDialog);
afterEach(cleanup);

describe("LocationSheet", () => {
  it("explains before asking and continues on request", () => {
    const onContinue = vi.fn();
    render(<LocationSheet mode="prime" native={false} onContinue={onContinue} onClose={vi.fn()} />);
    expect(screen.getByText(/not stored or shared/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("tells app users to use the phone's Settings when denied", () => {
    render(<LocationSheet mode="denied" native onContinue={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/phone's Settings/)).toBeTruthy();
  });

  it("tells browser users to use browser settings when denied", () => {
    render(<LocationSheet mode="denied" native={false} onContinue={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/browser settings/)).toBeTruthy();
  });
});
