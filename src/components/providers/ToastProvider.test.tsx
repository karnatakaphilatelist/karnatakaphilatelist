import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/components/providers/ToastProvider";

function Trigger({ onAction }: { onAction?: () => void }) {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({
          message: "Marked as visited",
          actionLabel: "Add photo or note",
          onAction,
        })
      }
    >
      show
    </button>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
  delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
});

describe("ToastProvider", () => {
  it("shows the message and hides it after a few seconds", () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => screen.getByText("show").click());
    expect(screen.getByText("Marked as visited")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(6100);
    });
    expect(screen.queryByText("Marked as visited")).toBeNull();
  });

  it("runs the action and dismisses the toast", () => {
    const onAction = vi.fn();
    render(
      <ToastProvider>
        <Trigger onAction={onAction} />
      </ToastProvider>
    );
    act(() => screen.getByText("show").click());
    act(() => screen.getByText("Add photo or note").click());

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Marked as visited")).toBeNull();
  });

  it("is shown as a popover so it stays above open dialogs", () => {
    const showPopover = vi.fn();
    Object.assign(HTMLElement.prototype, { showPopover, hidePopover: vi.fn() });

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => screen.getByText("show").click());

    // The browser hides a popover until it is shown, so find it by its text instead of its role.
    const toast = screen.getByText("Marked as visited").parentElement;
    expect(toast?.getAttribute("popover")).toBe("manual");
    expect(showPopover).toHaveBeenCalled();
  });

  it("lifts the toast again when a dialog opens after it", async () => {
    const showPopover = vi.fn();
    Object.assign(HTMLElement.prototype, { showPopover, hidePopover: vi.fn() });
    vi.useRealTimers();

    render(
      <ToastProvider>
        <Trigger />
        <dialog data-testid="dialog">dialog</dialog>
      </ToastProvider>
    );
    act(() => screen.getByText("show").click());
    const before = showPopover.mock.calls.length;

    await act(async () => {
      screen.getByTestId("dialog").setAttribute("open", "");
      await Promise.resolve();
    });

    expect(showPopover.mock.calls.length).toBeGreaterThan(before);
  });
});
