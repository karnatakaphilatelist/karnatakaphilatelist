import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "key" },
}));

import { stampImageUrl } from "@/lib/stamp-image";

describe("stampImageUrl", () => {
  it("returns null when a post office has no stamp image", () => {
    expect(stampImageUrl(null)).toBeNull();
    expect(stampImageUrl("")).toBeNull();
  });

  it("builds the public bucket URL", () => {
    expect(stampImageUrl("123.webp")).toBe(
      "https://example.supabase.co/storage/v1/object/public/office-stamps/123.webp",
    );
  });

  it("encodes unsafe characters in the path", () => {
    expect(stampImageUrl("my stamp.webp")).toContain("my%20stamp.webp");
  });
});
