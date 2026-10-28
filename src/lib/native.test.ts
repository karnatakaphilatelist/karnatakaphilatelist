import { describe, expect, it } from "vitest";
import { NATIVE_AUTH_REDIRECT, parseNativeAuthCode } from "@/lib/native";

describe("parseNativeAuthCode", () => {
  it("returns the code from the app's own sign-in link", () => {
    expect(parseNativeAuthCode(`${NATIVE_AUTH_REDIRECT}?code=abc123`)).toBe("abc123");
  });
  it("ignores other links and links without a code", () => {
    expect(parseNativeAuthCode("https://evil.example/?code=abc")).toBeNull();
    expect(parseNativeAuthCode(NATIVE_AUTH_REDIRECT)).toBeNull();
  });
});
