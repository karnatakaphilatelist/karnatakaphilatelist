import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AccountView } from "@/components/auth/AccountView";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }) }));

const auth = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
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

// jsdom does not implement the modal <dialog> methods, so give it minimal ones.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(
    this: HTMLDialogElement
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(
    this: HTMLDialogElement
  ) {
    this.removeAttribute("open");
  };
});

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

  it("asks for confirmation before deleting, then deletes and goes home", async () => {
    auth.user = { email: "asha@example.com", user_metadata: {} };
    auth.deleteAccount.mockResolvedValue(undefined);
    render(<AccountView />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(auth.deleteAccount).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete everything/i })
    );
    await waitFor(() => expect(auth.deleteAccount).toHaveBeenCalled());
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/"));
  });

  it("shows the problem and stays put when deleting fails", async () => {
    auth.user = { email: "asha@example.com", user_metadata: {} };
    auth.deleteAccount.mockRejectedValue(
      new Error("Could not delete your account. Please try again.")
    );
    render(<AccountView />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete everything/i })
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Could not delete/)
    );
    expect(nav.push).not.toHaveBeenCalled();
  });
});
