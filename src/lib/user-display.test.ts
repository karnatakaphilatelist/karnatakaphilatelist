import { describe, expect, it } from "vitest";
import { getAvatarUrl, getDisplayName, getFirstName, getInitial } from "@/lib/user-display";

const user = (email: string | null, meta: Record<string, unknown> = {}) => ({
  email: email ?? undefined,
  user_metadata: meta,
});

describe("getDisplayName", () => {
  it("prefers the name from Google", () => {
    expect(getDisplayName(user("a@b.co", { full_name: " Asha Rao " }))).toBe("Asha Rao");
    expect(getDisplayName(user("a@b.co", { name: "Asha" }))).toBe("Asha");
  });

  it("falls back to the email, then to nothing", () => {
    expect(getDisplayName(user("a@b.co"))).toBe("a@b.co");
    expect(getDisplayName(user(null))).toBeNull();
  });

  it("limits an absurdly long name", () => {
    expect(getDisplayName(user(null, { full_name: "x".repeat(500) }))).toHaveLength(200);
  });
});

describe("getAvatarUrl", () => {
  it("accepts an https photo from either metadata key", () => {
    expect(getAvatarUrl(user(null, { avatar_url: "https://img.test/a.png" }))).toBe(
      "https://img.test/a.png",
    );
    expect(getAvatarUrl(user(null, { picture: "https://img.test/b.png" }))).toBe(
      "https://img.test/b.png",
    );
  });

  it("rejects anything that is not a plain https URL", () => {
    expect(getAvatarUrl(user(null, { avatar_url: "javascript:alert(1)" }))).toBeNull();
    expect(getAvatarUrl(user(null, { avatar_url: "http://img.test/a.png" }))).toBeNull();
    expect(getAvatarUrl(user(null, { avatar_url: 42 }))).toBeNull();
    expect(getAvatarUrl(user(null, { avatar_url: `https://x/${"a".repeat(3000)}` }))).toBeNull();
    expect(getAvatarUrl(user(null))).toBeNull();
  });
});

describe("getInitial", () => {
  it("uses the first letter of the name or email, capitalised", () => {
    expect(getInitial(user("z@b.co", { full_name: "asha" }))).toBe("A");
    expect(getInitial(user("z@b.co"))).toBe("Z");
    expect(getInitial(user(null))).toBe("?");
  });
});

describe("getFirstName", () => {
  it("returns the first word of the name", () => {
    expect(getFirstName(user("a@b.c", { full_name: "Asha Rao" }))).toBe("Asha");
  });
  it("returns null when only an email is known", () => {
    expect(getFirstName(user("a@b.c"))).toBeNull();
  });
});
