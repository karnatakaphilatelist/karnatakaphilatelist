import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const exchange = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { exchangeCodeForSession: exchange },
  }),
}));

const call = (query: string) => GET(new Request(`https://site.test/auth/callback${query}`));
const location = (response: Response) => new URL(response.headers.get("location") ?? "");

beforeEach(() => {
  exchange.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("GET /auth/callback", () => {
  it("sends the person back to the page they started on after a successful sign-in", async () => {
    exchange.mockResolvedValue({ error: null });
    const response = await call("?code=abc&next=%2Fpassport");
    expect(exchange).toHaveBeenCalledWith("abc");
    expect(location(response).pathname).toBe("/passport");
    expect(location(response).searchParams.get("auth")).toBeNull();
  });

  it("does not follow a next value that points to another site", async () => {
    exchange.mockResolvedValue({ error: null });
    const response = await call("?code=abc&next=%2F%2Fevil.example");
    expect(location(response).origin).toBe("https://site.test");
    expect(location(response).pathname).toBe("/");
  });

  it("explains a cancelled sign-in and keeps the person's page", async () => {
    const response = await call("?error=access_denied&next=%2F%3Foffice%3D4");
    const target = location(response);
    expect(exchange).not.toHaveBeenCalled();
    expect(target.searchParams.get("auth")).toBe("failed");
    expect(target.searchParams.get("reason")).toBe("denied");
    expect(target.searchParams.get("office")).toBe("4");
  });

  it("explains an expired email link", async () => {
    const response = await call("?error=access_denied&error_code=otp_expired");
    expect(location(response).searchParams.get("reason")).toBe("expired");
  });

  it("explains a link opened in the wrong browser and logs the cause", async () => {
    exchange.mockResolvedValue({
      error: { status: 400, code: "flow_state_not_found", message: "PKCE code verifier not found" },
    });
    const response = await call("?code=abc");
    expect(location(response).searchParams.get("reason")).toBe("other-device");
    expect(console.error).toHaveBeenCalled();
  });

  it("reports a plain failure when there is no code and no error", async () => {
    const response = await call("");
    expect(location(response).searchParams.get("reason")).toBe("failed");
  });
});
