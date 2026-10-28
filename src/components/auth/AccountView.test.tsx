import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountView } from "@/components/auth/AccountView";

const auth = vi.hoisted(() => ({
  user: null as {
    email: string;
    user_metadata: Record<string, unknown>;
  } | null,
  openSignIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ ...auth, isLoading: false }),
}));
vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  auth.user = null;
  vi.clearAllMocks();
});

describe("AccountView", () => {
  it("invites a guest to sign in and hides password and sign-out", () => {
    render(<AccountView />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.openSignIn).toHaveBeenCalled();
    expect(screen.queryByText("Set or change password")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("shows a signed-in person's details, password link and sign-out", () => {
    auth.user = {
      email: "asha@example.com",
      user_metadata: { full_name: "Asha Rao" },
    };
    render(<AccountView />);
    expect(screen.getByText("asha@example.com")).toBeDefined();
    expect(screen.getByText("Set or change password")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalled();
  });
});
