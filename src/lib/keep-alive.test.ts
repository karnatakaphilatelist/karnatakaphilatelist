import { describe, expect, it, vi } from "vitest";
import { isAuthorised, pingDatabase } from "@/lib/keep-alive";

type Ping = Parameters<typeof pingDatabase>[0];

const clientReturning = (result: Promise<unknown>) => {
  const client = { from: vi.fn(() => ({ select: vi.fn(() => result) })) };
  return client as unknown as Ping & { from: typeof client.from };
};

describe("pingDatabase", () => {
  it("reports success with the row count", async () => {
    const client = clientReturning(Promise.resolve({ count: 99, error: null }));
    await expect(pingDatabase(client)).resolves.toEqual({ ok: true, postOffices: 99 });
    expect(client.from).toHaveBeenCalledWith("post_offices");
  });

  it("reports a database error without throwing", async () => {
    const client = clientReturning(Promise.resolve({ count: null, error: { message: "paused" } }));
    await expect(pingDatabase(client)).resolves.toEqual({ ok: false, error: "paused" });
  });

  it("reports a network failure without throwing", async () => {
    const client = clientReturning(Promise.reject(new Error("fetch failed")));
    await expect(pingDatabase(client)).resolves.toEqual({ ok: false, error: "fetch failed" });
  });
});

describe("isAuthorised", () => {
  it("is open when no secret is configured", () => {
    expect(isAuthorised(null, undefined)).toBe(true);
  });
  it("requires the bearer token when a secret is configured", () => {
    expect(isAuthorised("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorised("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorised(null, "s3cret")).toBe(false);
  });
});
