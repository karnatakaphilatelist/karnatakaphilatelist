import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetPasswordView } from "@/components/auth/SetPasswordView";

const state = vi.hoisted(() => ({
  user: null as { email: string } | null,
  openSignIn: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: state.user, isLoading: false, openSignIn: state.openSignIn }),
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { updateUser: state.updateUser } }),
}));

afterEach(() => {
  cleanup();
  state.user = null;
  vi.clearAllMocks();
});

describe("SetPasswordView", () => {
  it("asks signed-out visitors to sign in first", () => {
    render(<SetPasswordView />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(state.openSignIn).toHaveBeenCalled();
  });

  it("rejects short or mismatched passwords and saves a good one", async () => {
    state.user = { email: "asha@example.com" };
    state.updateUser.mockResolvedValue({ error: null });
    render(<SetPasswordView />);
    const [first, second] = screen.getAllByLabelText(/password|repeat/i);

    fireEvent.change(first, { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/at least 8/);

    fireEvent.change(first, { target: { value: "longenough1" } });
    fireEvent.change(second, { target: { value: "different11" } });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/do not match/);

    fireEvent.change(second, { target: { value: "longenough1" } });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    await waitFor(() => expect(screen.getByText(/password is saved/i)).toBeTruthy());
    expect(state.updateUser).toHaveBeenCalledWith({ password: "longenough1" });
  });
});
