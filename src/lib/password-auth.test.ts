import { describe, expect, it } from "vitest";
import {
  friendlyPasswordError,
  interpretSignUp,
  MIN_PASSWORD_LENGTH,
  validatePassword,
} from "@/lib/password-auth";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH - 1))).toContain("at least");
  });
  it("accepts passwords of the minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });
});

describe("interpretSignUp", () => {
  it("treats a session as signed in", () => {
    expect(interpretSignUp({ session: {}, user: { identities: [{}] } })).toBe("signed-in");
  });
  it("asks for email confirmation when there is no session", () => {
    expect(interpretSignUp({ session: null, user: { identities: [{}] } })).toBe("confirm-email");
  });
  it("detects an address that already has an account", () => {
    expect(interpretSignUp({ session: null, user: { identities: [] } })).toBe("exists");
  });
  it("does not call a missing identities list an existing account", () => {
    expect(interpretSignUp({ session: null, user: {} })).toBe("confirm-email");
  });
});

describe("friendlyPasswordError", () => {
  it("explains wrong credentials without saying which part is wrong", () => {
    const message = friendlyPasswordError({ code: "invalid_credentials" }, "signin");
    expect(message).toContain("do not match");
  });
  it("points unconfirmed accounts to their email", () => {
    expect(friendlyPasswordError({ code: "email_not_confirmed" }, "signin")).toContain("confirm");
  });
  it("handles an existing account on sign up", () => {
    expect(friendlyPasswordError({ code: "user_already_exists" }, "signup")).toContain("signing in");
  });
  it("handles rate limits", () => {
    expect(friendlyPasswordError({ code: "over_email_send_rate_limit" }, "signup")).toContain("wait");
  });
  it("falls back to a generic message per mode", () => {
    expect(friendlyPasswordError({ message: "boom" }, "signin")).toContain("sign you in");
    expect(friendlyPasswordError({ message: "boom" }, "signup")).toContain("create your account");
  });
});
