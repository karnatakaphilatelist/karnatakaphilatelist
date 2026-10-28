import { describe, expect, it, vi } from "vitest";
import { deleteMyAccount } from "@/lib/delete-account";

function fakeClient(opts: {
  paths?: string[];
  listError?: boolean;
  removeError?: boolean;
  rpcError?: boolean;
}) {
  const remove = vi
    .fn()
    .mockResolvedValue({ error: opts.removeError ? { message: "x" } : null });
  const rpc = vi
    .fn()
    .mockResolvedValue({ error: opts.rpcError ? { message: "x" } : null });
  const query = {
    select: () => query,
    eq: () => query,
    not: () =>
      Promise.resolve({
        data: (opts.paths ?? []).map((photo_path) => ({ photo_path })),
        error: opts.listError ? { message: "x" } : null,
      }),
  };
  const client = {
    from: () => query,
    storage: { from: () => ({ remove }) },
    rpc,
  };
  return { client: client as never, remove, rpc };
}

describe("deleteMyAccount", () => {
  it("removes photos then the account", async () => {
    const { client, remove, rpc } = fakeClient({
      paths: ["u/1.jpg", "u/2.jpg"],
    });
    await deleteMyAccount(client, "u");
    expect(remove).toHaveBeenCalledWith(["u/1.jpg", "u/2.jpg"]);
    expect(rpc).toHaveBeenCalledWith("delete_my_account");
  });
  it("skips storage when there are no photos", async () => {
    const { client, remove, rpc } = fakeClient({});
    await deleteMyAccount(client, "u");
    expect(remove).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalled();
  });
  it("stops and reports when a step fails, without deleting the account", async () => {
    const photos = fakeClient({ paths: ["u/1.jpg"], removeError: true });
    await expect(deleteMyAccount(photos.client, "u")).rejects.toThrow(/photos/);
    expect(photos.rpc).not.toHaveBeenCalled();
    const account = fakeClient({ rpcError: true });
    await expect(deleteMyAccount(account.client, "u")).rejects.toThrow(
      /account/
    );
  });
});
