import { afterEach, describe, expect, it, vi } from "vitest";
import { progressShareText, shareContent } from "@/lib/share";

const content = {
  title: "Philatelist",
  text: "Hello",
  url: "https://example.com",
};

afterEach(() => vi.unstubAllGlobals());

describe("progressShareText", () => {
  it("words a first-timer and a collector differently", () => {
    expect(progressShareText(0, 99, "Karnataka")).toMatch(/starting/);
    expect(progressShareText(12, 99, "Karnataka")).toBe(
      "I've collected 12 of 99 post office stamps in Karnataka."
    );
  });
});

describe("shareContent", () => {
  it("uses the browser share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    expect(await shareContent(content)).toBe("shared");
    expect(share).toHaveBeenCalledWith(content);
  });
  it("copies the text when sharing is not available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareContent(content)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Hello https://example.com");
  });
  it("treats closing the share sheet as fine and other errors as failed", async () => {
    const abort = Object.assign(new Error("closed"), { name: "AbortError" });
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(abort) });
    expect(await shareContent(content)).toBe("shared");
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("boom")),
    });
    expect(await shareContent(content)).toBe("failed");
  });
});
