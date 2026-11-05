import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoachTour } from "@/components/explore/CoachTour";
import { TOUR_SEEN_KEY } from "@/lib/constants";

const pathname = vi.hoisted(() => ({ current: "/explore" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

/** jsdom has no layout, so every element reports a box of this size. */
const BOX = { top: 100, left: 20, width: 200, height: 44, right: 220, bottom: 144, x: 20, y: 100 };

function Screen({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name) => (
        <div key={name} data-tour={name}>
          {name}
        </div>
      ))}
    </>
  );
}

async function startTour() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

describe("CoachTour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    pathname.current = "/explore";
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      ...BOX,
      toJSON: () => ({}),
    } as DOMRect);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("walks through each control and remembers it was finished", async () => {
    render(
      <>
        <Screen names={["search", "filters", "near-me", "list", "passport"]} />
        <CoachTour ready />
      </>
    );
    await startTour();

    expect(screen.getByRole("heading", { name: "Search anywhere" })).toBeTruthy();
    expect(screen.getByText("1 of 5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Filter by progress" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Your passport" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("true");
  });

  it("can be skipped at any step and stays gone", async () => {
    const view = render(
      <>
        <Screen names={["search", "filters"]} />
        <CoachTour ready />
      </>
    );
    await startTour();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("true");

    view.rerender(
      <>
        <Screen names={["search", "filters"]} />
        <CoachTour ready />
      </>
    );
    await startTour();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leaves out controls that are not on screen, such as the phone-only list bar on a big screen", async () => {
    render(
      <>
        <Screen names={["search", "passport"]} />
        <CoachTour ready />
      </>
    );
    await startTour();
    expect(screen.getByText("1 of 2")).toBeTruthy();
  });

  it("does not appear for someone who has already seen it", async () => {
    localStorage.setItem(TOUR_SEEN_KEY, "true");
    render(
      <>
        <Screen names={["search"]} />
        <CoachTour ready />
      </>
    );
    await startTour();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("waits until the screen is ready, and stays off other tabs", async () => {
    const view = render(
      <>
        <Screen names={["search"]} />
        <CoachTour ready={false} />
      </>
    );
    await startTour();
    expect(screen.queryByRole("dialog")).toBeNull();

    pathname.current = "/passport";
    view.rerender(
      <>
        <Screen names={["search"]} />
        <CoachTour ready />
      </>
    );
    await startTour();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
