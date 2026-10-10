import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuestSignInPrompt } from "@/components/auth/GuestSignInPrompt";
import { SIGN_IN_PROMPTED_KEY } from "@/lib/constants";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  visitCount: 0,
  openSignIn: vi.fn(),
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: state.user, isLoading: false, openSignIn: state.openSignIn }),
}));
vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({
    isReady: true,
    visits: Object.fromEntries(
      Array.from({ length: state.visitCount }, (_, index) => [index, {}]),
    ),
  }),
}));

beforeEach(() => {
  window.localStorage.clear();
  state.user = null;
  state.visitCount = 0;
  state.openSignIn.mockReset();
});

afterEach(cleanup);

describe("GuestSignInPrompt", () => {
  it("stays quiet below the threshold", () => {
    state.visitCount = 2;
    render(<GuestSignInPrompt />);
    expect(state.openSignIn).not.toHaveBeenCalled();
  });

  it("invites a guest to sign in at the threshold, only once", () => {
    state.visitCount = 3;
    const { rerender } = render(<GuestSignInPrompt />);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);
    expect(state.openSignIn).toHaveBeenCalledWith("save-progress");
    expect(window.localStorage.getItem(SIGN_IN_PROMPTED_KEY)).toBe("true");

    rerender(<GuestSignInPrompt />);
    expect(state.openSignIn).toHaveBeenCalledTimes(1);
  });

  it("never prompts a signed-in user", () => {
    state.user = { id: "user-1" };
    state.visitCount = 5;
    render(<GuestSignInPrompt />);
    expect(state.openSignIn).not.toHaveBeenCalled();
  });
});
