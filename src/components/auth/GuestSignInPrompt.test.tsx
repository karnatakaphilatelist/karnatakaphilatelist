import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GuestSignInPrompt,
  PROMPT_DELAY_MS,
  PROMPT_RETRY_MS,
  WELCOME_DELAY_MS,
} from "@/components/auth/GuestSignInPrompt";
import {
  COACH_KEY,
  SIGN_IN_PROMPTED_KEY,
  WELCOME_PROMPTED_KEY,
} from "@/lib/constants";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  visitCount: 0,
  openSignIn: vi.fn(),
  path: "/passport",
}));

vi.mock("next/navigation", () => ({ usePathname: () => state.path }));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: state.user,
    isLoading: false,
    openSignIn: state.openSignIn,
  }),
}));
vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({
    isReady: true,
    visits: Object.fromEntries(
      Array.from({ length: state.visitCount }, (_, index) => [index, {}])
    ),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  state.user = null;
  state.visitCount = 0;
  state.path = "/passport";
  state.openSignIn.mockReset();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("GuestSignInPrompt", () => {
  it("stays quiet below the threshold", () => {
    state.visitCount = 2;
    render(<GuestSignInPrompt />);
    wait(PROMPT_DELAY_MS * 2);
    expect(state.openSignIn).not.toHaveBeenCalled();
  });

  it("waits a moment after the threshold so the visit message stays usable", () => {
    state.visitCount = 3;
    render(<GuestSignInPrompt />);

    wait(PROMPT_DELAY_MS - 1);
    expect(state.openSignIn).not.toHaveBeenCalled();

    wait(1);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);
    expect(state.openSignIn).toHaveBeenCalledWith("save-progress");
    expect(window.localStorage.getItem(SIGN_IN_PROMPTED_KEY)).toBe("true");
  });

  it("invites a guest only once", () => {
    state.visitCount = 3;
    const { rerender } = render(<GuestSignInPrompt />);
    wait(PROMPT_DELAY_MS);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);

    rerender(<GuestSignInPrompt />);
    wait(PROMPT_DELAY_MS * 2);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);
  });

  it("never prompts a signed-in user", () => {
    state.user = { id: "user-1" };
    state.visitCount = 5;
    render(<GuestSignInPrompt />);
    wait(PROMPT_DELAY_MS * 2);
    expect(state.openSignIn).not.toHaveBeenCalled();
  });

  it("does not interrupt a dialog that is already open, and prompts once it closes", () => {
    state.visitCount = 3;
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.append(dialog);

    render(<GuestSignInPrompt />);
    wait(PROMPT_DELAY_MS + PROMPT_RETRY_MS * 3);
    expect(state.openSignIn).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(SIGN_IN_PROMPTED_KEY)).toBeNull();

    dialog.removeAttribute("open");
    wait(PROMPT_RETRY_MS);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending prompt when the person leaves the page", () => {
    state.visitCount = 3;
    const view = render(<GuestSignInPrompt />);
    view.unmount();
    wait(PROMPT_DELAY_MS * 2);
    expect(state.openSignIn).not.toHaveBeenCalled();
  });

  describe("first invitation", () => {
    it("opens once on the map after the tour, then never again", () => {
      state.path = "/explore";
      window.localStorage.setItem(COACH_KEY, "true");
      const { unmount } = render(<GuestSignInPrompt />);
      wait(WELCOME_DELAY_MS);
      expect(state.openSignIn).toHaveBeenCalledWith("welcome");
      expect(window.localStorage.getItem(WELCOME_PROMPTED_KEY)).toBe("true");
      unmount();
      state.openSignIn.mockReset();
      render(<GuestSignInPrompt />);
      wait(WELCOME_DELAY_MS * 3);
      expect(state.openSignIn).not.toHaveBeenCalled();
    });

    it("waits for the tour to finish", () => {
      state.path = "/explore";
      render(<GuestSignInPrompt />);
      wait(WELCOME_DELAY_MS + PROMPT_RETRY_MS * 3);
      expect(state.openSignIn).not.toHaveBeenCalled();
      window.localStorage.setItem(COACH_KEY, "true");
      wait(PROMPT_RETRY_MS);
      expect(state.openSignIn).toHaveBeenCalledWith("welcome");
    });

    it("stays away from other pages and signed-in people", () => {
      window.localStorage.setItem(COACH_KEY, "true");
      render(<GuestSignInPrompt />);
      wait(WELCOME_DELAY_MS * 3);
      expect(state.openSignIn).not.toHaveBeenCalled();
      cleanup();
      state.path = "/explore";
      state.user = { id: "u1" };
      render(<GuestSignInPrompt />);
      wait(WELCOME_DELAY_MS * 3);
      expect(state.openSignIn).not.toHaveBeenCalled();
    });
  });
});
