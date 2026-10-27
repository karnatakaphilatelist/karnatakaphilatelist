import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthDialog } from "@/components/auth/AuthDialog";

// jsdom does not implement the modal <dialog> methods, so give it minimal ones.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

const handlers = {
  onClose: vi.fn(),
  onGoogle: vi.fn(),
  onEmail: vi.fn(),
  onVerifyCode: vi.fn(),
};

function renderDialog(googleAvailable = true) {
  return render(<AuthDialog reason="manual" googleAvailable={googleAvailable} {...handlers} />);
}

beforeEach(() => {
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

afterEach(cleanup);

/** Types an email and requests the sign-in link, leaving the dialog on its "sent" step. */
async function requestLink(email = "asha@example.com") {
  handlers.onEmail.mockResolvedValue(undefined);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
  await screen.findByText(/We sent a sign-in link/);
}

describe("Google sign-in", () => {
  it("disables the button while the browser is on its way to Google, so it cannot be tapped twice", async () => {
    handlers.onGoogle.mockReturnValue(new Promise(() => undefined));
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    const busy = await screen.findByRole("button", { name: "Opening Google…" });
    expect((busy as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(busy);
    expect(handlers.onGoogle).toHaveBeenCalledTimes(1);
  });

  it("re-enables the button and shows the error when Google sign-in fails to start", async () => {
    handlers.onGoogle.mockRejectedValue(new Error("Unsupported provider"));
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Unsupported provider");
    const button = screen.getByRole("button", { name: "Continue with Google" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it("is hidden, with an explanation, when Google is switched off", () => {
    renderDialog(false);
    expect(screen.queryByRole("button", { name: /Continue with Google/ })).toBeNull();
    expect(screen.getByText(/Google sign-in is not available right now/)).toBeDefined();
    expect(screen.getByLabelText("Email address")).toBeDefined();
  });
});

describe("email sign-in", () => {
  it("offers the 6-digit code after the link is sent", async () => {
    renderDialog();
    await requestLink();
    expect(screen.getByLabelText(/Enter the 6-digit code/)).toBeDefined();
    expect(handlers.onEmail).toHaveBeenCalledWith("asha@example.com");
  });

  it("signs in with the code, ignoring spaces", async () => {
    handlers.onVerifyCode.mockResolvedValue(undefined);
    renderDialog();
    await requestLink();

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), {
      target: { value: "123 456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with code" }));

    await waitFor(() =>
      expect(handlers.onVerifyCode).toHaveBeenCalledWith("asha@example.com", "123456"),
    );
  });

  it("does not call the server for a code that is clearly wrong", async () => {
    renderDialog();
    await requestLink();

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), { target: { value: "12ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with code" }));

    expect((await screen.findByRole("alert")).textContent).toContain("6-digit code");
    expect(handlers.onVerifyCode).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the server rejects the code", async () => {
    handlers.onVerifyCode.mockRejectedValue(new Error("Token has expired or is invalid"));
    renderDialog();
    await requestLink();

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with code" }));

    expect((await screen.findByRole("alert")).textContent).toContain("did not work");
  });

  it("lets the person go back and use a different email", async () => {
    renderDialog();
    await requestLink();

    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.getByLabelText("Email address")).toBeDefined();
  });
});

describe("legal links", () => {
  it("links to the terms and privacy policy", () => {
    renderDialog();
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });
});
