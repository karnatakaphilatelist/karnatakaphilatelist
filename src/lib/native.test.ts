import { describe, expect, it } from "vitest";
import {
  NATIVE_AUTH_REDIRECT,
  parseNativeAuthCode,
  pathFromSiteLink,
} from "@/lib/native";

describe("parseNativeAuthCode", () => {
  it("returns the code from the app's own sign-in link", () => {
    expect(parseNativeAuthCode(`${NATIVE_AUTH_REDIRECT}?code=abc123`)).toBe(
      "abc123"
    );
  });
  it("ignores other links and links without a code", () => {
    expect(parseNativeAuthCode("https://evil.example/?code=abc")).toBeNull();
    expect(parseNativeAuthCode(NATIVE_AUTH_REDIRECT)).toBeNull();
  });
});

describe("pathFromSiteLink", () => {
  it("returns the path and query of a philatrail.com link", () => {
    expect(
      pathFromSiteLink("https://philatrail.com/offices/hampi-so-583239")
    ).toBe("/offices/hampi-so-583239");
    expect(
      pathFromSiteLink("https://www.philatrail.com/explore?office=5")
    ).toBe("/explore?office=5");
  });

  it("ignores other hosts, plain http and junk", () => {
    expect(pathFromSiteLink("https://example.com/offices")).toBeNull();
    expect(pathFromSiteLink("http://philatrail.com/offices")).toBeNull();
    expect(pathFromSiteLink("https://philatrail.com.evil.com/x")).toBeNull();
    expect(pathFromSiteLink("not a url")).toBeNull();
  });
});
