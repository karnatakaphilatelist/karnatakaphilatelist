import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoachTour } from "@/components/layout/CoachTour";
import { COACH_KEY, WELCOME_PROMPTED_KEY } from "@/lib/constants";

const state = vi.hoisted(() => ({ user: null as { id: string } | null }));

vi.mock("next/navigation", () => ({ usePathname: () => "/explore" }));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: state.user, isLoading: false }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  state.user = null;
});
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const started = () => window.localStorage.getItem(COACH_KEY) === "true";

describe("CoachTour first visit", () => {
  it("waits for a guest to be invited to sign in first", () => {
    render(<CoachTour />);
    wait(10000);
    expect(started()).toBe(false);
  });

  it("stays away while the invitation is open, then starts after it closes", () => {
    window.localStorage.setItem(WELCOME_PROMPTED_KEY, "true");
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);
    render(<CoachTour />);
    wait(5000);
    expect(started()).toBe(false);
    dialog.remove();
    wait(2000);
    expect(started()).toBe(true);
  });

  it("starts on its own for someone already signed in", () => {
    state.user = { id: "u1" };
    render(<CoachTour />);
    wait(3000);
    expect(started()).toBe(true);
  });
});
