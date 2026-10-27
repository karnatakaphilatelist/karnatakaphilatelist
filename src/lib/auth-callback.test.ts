import { describe, expect, it } from "vitest";
import {
  AUTH_FAILURE_MESSAGES,
  classifyAuthFailure,
  failureRedirectUrl,
  isAuthFailureReason,
  safeRedirectPath,
} from "@/lib/auth-callback";

describe("safeRedirectPath", () => {
  it("keeps normal in-site paths, including the query string", () => {
    expect(safeRedirectPath("/passport")).toBe("/passport");
    expect(safeRedirectPath("/?office=12")).toBe("/?office=12");
  });

  it.each([null, "", "passport", "https://evil.example", "//evil.example", "/\\evil.example"])(
    "falls back to the home page for %j",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/");
    },
  );

  it("never loops back into the auth routes", () => {
    expect(safeRedirectPath("/auth/callback?next=/")).toBe("/");
  });
});

describe("classifyAuthFailure", () => {
  it("recognises a cancelled sign-in", () => {
    expect(classifyAuthFailure({ providerError: "access_denied" })).toBe("denied");
  });

  it("treats an expired email link as expired, even though it also says access_denied", () => {
    expect(
      classifyAuthFailure({ providerError: "access_denied", errorCode: "otp_expired" }),
    ).toBe("expired");
  });

  it("recognises a link opened in a different browser", () => {
    expect(
      classifyAuthFailure({ exchangeMessage: "PKCE code verifier not found in storage" }),
    ).toBe("other-device");
  });

  it("recognises an expired or reused code from the exchange", () => {
    expect(classifyAuthFailure({ exchangeMessage: "Token has expired or is invalid" })).toBe(
      "expired",
    );
  });

  it("falls back to a generic failure", () => {
    expect(classifyAuthFailure({})).toBe("failed");
    expect(classifyAuthFailure({ exchangeMessage: "boom" })).toBe("failed");
  });
});

describe("failureRedirectUrl", () => {
  it("returns to the page the person was on and flags the failure", () => {
    const url = new URL(failureRedirectUrl("https://site.test", "/?office=3", "denied"));
    expect(url.origin).toBe("https://site.test");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("office")).toBe("3");
    expect(url.searchParams.get("auth")).toBe("failed");
    expect(url.searchParams.get("reason")).toBe("denied");
  });

  it("stays on this site even for a hostile next value", () => {
    const url = new URL(failureRedirectUrl("https://site.test", "//evil.example", "failed"));
    expect(url.origin).toBe("https://site.test");
  });
});

describe("isAuthFailureReason", () => {
  it("accepts only the known codes", () => {
    expect(isAuthFailureReason("denied")).toBe(true);
    expect(isAuthFailureReason("toString")).toBe(false);
    expect(isAuthFailureReason("<script>")).toBe(false);
    expect(isAuthFailureReason(null)).toBe(false);
  });

  it("has a message for every code", () => {
    for (const message of Object.values(AUTH_FAILURE_MESSAGES)) {
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
