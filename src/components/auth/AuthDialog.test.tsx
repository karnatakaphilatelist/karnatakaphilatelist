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
  onPassword: vi.fn(),
};

function renderDialog(googleAvailable = true) {
  return render(<AuthDialog reason="manual" googleAvailable={googleAvailable} {...handlers} />);
}

beforeEach(() => {
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

afterEach(cleanup);

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

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("password sign-in", () => {
  it("signs in with the email and password", async () => {
    handlers.onPassword.mockResolvedValue("signed-in");
    renderDialog();

    fill("Email address", " asha@example.com ");
    fill("Password", "correct horse");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(handlers.onPassword).toHaveBeenCalledWith("signin", "asha@example.com", "correct horse"),
    );
  });

  it("shows the reason when sign-in fails and lets the person try again", async () => {
    handlers.onPassword.mockRejectedValue(new Error("That email and password do not match."));
    renderDialog();

    fill("Email address", "asha@example.com");
    fill("Password", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect((await screen.findByRole("alert")).textContent).toContain("do not match");
    expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("creating an account", () => {
  function openSignUp() {
    fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
  }

  it("refuses a short password without calling the server", async () => {
    renderDialog();
    openSignUp();

    fill("Email address", "asha@example.com");
    fill("Password", "short");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    expect((await screen.findByRole("alert")).textContent).toContain("at least 8");
    expect(handlers.onPassword).not.toHaveBeenCalled();
  });

  it("creates the account", async () => {
    handlers.onPassword.mockResolvedValue("signed-in");
    renderDialog();
    openSignUp();

    fill("Email address", "asha@example.com");
    fill("Password", "long enough password");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(handlers.onPassword).toHaveBeenCalledWith(
        "signup",
        "asha@example.com",
        "long enough password",
      ),
    );
  });

  it("asks the person to confirm their email when the project requires it", async () => {
    handlers.onPassword.mockResolvedValue("confirm-email");
    renderDialog();
    openSignUp();

    fill("Email address", "asha@example.com");
    fill("Password", "long enough password");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect((await screen.findByRole("status")).textContent).toContain("confirmation link");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Email address")).toBeDefined();
  });

  it("can switch back to signing in", () => {
    renderDialog();
    openSignUp();
    fireEvent.click(screen.getByRole("button", { name: "Already have an account? Sign in" }));
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });
});

describe("sign-in link", () => {
  it("emails a link and says so, without any code box", async () => {
    handlers.onEmail.mockResolvedValue(undefined);
    renderDialog();

    fill("Email address", "asha@example.com");
    fireEvent.click(screen.getByRole("button", { name: /Forgot password/ }));

    expect((await screen.findByRole("status")).textContent).toContain("sign-in link");
    expect(handlers.onEmail).toHaveBeenCalledWith("asha@example.com");
    expect(screen.queryByLabelText(/code/i)).toBeNull();
  });

  it("asks for an email address before sending a link", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Forgot password/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Enter your email");
    expect(handlers.onEmail).not.toHaveBeenCalled();
  });

  it("shows an error when the link cannot be sent", async () => {
    handlers.onEmail.mockRejectedValue(new Error("Email rate limit exceeded"));
    renderDialog();
    fill("Email address", "asha@example.com");
    fireEvent.click(screen.getByRole("button", { name: /Forgot password/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("rate limit");
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
