import { describe, expect, it } from "vitest";
import {
  parseNativeAuthCode,
  pathFromSiteLink,
} from "@/lib/native";

describe("parseNativeAuthCode", () => {
  it("extracts the code from the Android HTTPS App Link redirect", () => {
    expect(
      parseNativeAuthCode(
        "https://philatrail.com/auth/callback?code=abc123"
      )
    ).toBe("abc123");
  });

  it("extracts the code from the iOS custom scheme redirect", () => {
    expect(
      parseNativeAuthCode(
        "app.vinvi.philatrail://auth/callback?code=abc123"
      )
    ).toBe("abc123");
  });

  it("returns null when there is no code parameter", () => {
    expect(
      parseNativeAuthCode("https://philatrail.com/auth/callback")
    ).toBeNull();
    expect(
      parseNativeAuthCode("app.vinvi.philatrail://auth/callback")
    ).toBeNull();
  });

  it("ignores other hosts and schemes", () => {
    expect(parseNativeAuthCode("https://evil.example/?code=abc")).toBeNull();
    expect(parseNativeAuthCode("https://philatrail.com/explore?code=x")).toBeNull();
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

  it("does NOT treat /auth/callback as navigation (parseNativeAuthCode handles it)", () => {
    expect(
      pathFromSiteLink("https://philatrail.com/auth/callback?code=abc")
    ).toBeNull();
  });
});
