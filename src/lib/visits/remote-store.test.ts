import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  insertVisitIfMissing,
  mergeGuestVisits,
  updateVisitDetails,
} from "@/lib/visits/remote-store";
import type { Visit } from "@/types";

const visit = (officeId: number): Visit => ({
  officeId,
  visitedAt: "2026-10-01",
  note: "hello",
  photoPath: null,
  isPublic: false,
});

type Result = { error: { code?: string; message: string } | null };

/** A stand-in for the Supabase client that only supports `from("visits").upsert(...)`. */
function upsertClient(respond: (rows: { post_office_id: number }[]) => Result) {
  const upsert = vi.fn(async (rows: { post_office_id: number }[]) => respond(rows));
  const client = { from: vi.fn(() => ({ upsert })) } as unknown as SupabaseClient;
  return { client, upsert };
}

describe("mergeGuestVisits", () => {
  it("does nothing when there is nothing to merge", async () => {
    const { client, upsert } = upsertClient(() => ({ error: null }));
    await mergeGuestVisits(client, "u1", []);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("saves everything in one request and never overwrites existing rows", async () => {
    const { client, upsert } = upsertClient(() => ({ error: null }));
    await mergeGuestVisits(client, "u1", [visit(1), visit(2)]);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0]).toHaveLength(2);
    const options = (upsert.mock.calls[0] as unknown[])[1];
    expect(options).toMatchObject({ ignoreDuplicates: true });
  });

  it("still saves the good rows when one post office no longer exists", async () => {
    const saved: number[] = [];
    const { client } = upsertClient((rows) => {
      if (rows.length > 1) return { error: { code: "23503", message: "fk" } };
      if (rows[0].post_office_id === 2) return { error: { code: "23503", message: "fk" } };
      saved.push(rows[0].post_office_id);
      return { error: null };
    });

    await expect(
      mergeGuestVisits(client, "u1", [visit(1), visit(2), visit(3)]),
    ).resolves.toBeUndefined();
    expect(saved).toEqual([1, 3]);
  });

  it("reports errors that are not about a missing post office", async () => {
    const { client } = upsertClient(() => ({ error: { code: "42501", message: "denied" } }));
    await expect(mergeGuestVisits(client, "u1", [visit(1)])).rejects.toThrow("denied");
  });

  it("reports a hard failure that only shows up during the row-by-row retry", async () => {
    const { client } = upsertClient((rows) => {
      if (rows.length > 1) return { error: { code: "23503", message: "fk" } };
      return rows[0].post_office_id === 2
        ? { error: { code: "57014", message: "timeout" } }
        : { error: null };
    });
    await expect(mergeGuestVisits(client, "u1", [visit(1), visit(2)])).rejects.toThrow("timeout");
  });
});

describe("insertVisitIfMissing", () => {
  it("asks the database to leave an existing visit untouched", async () => {
    const { client, upsert } = upsertClient(() => ({ error: null }));
    await insertVisitIfMissing(client, "u1", visit(5));
    const options = (upsert.mock.calls[0] as unknown[])[1];
    expect(options).toMatchObject({ onConflict: "user_id,post_office_id", ignoreDuplicates: true });
  });

  it("throws the database error message", async () => {
    const { client } = upsertClient(() => ({ error: { message: "boom" } }));
    await expect(insertVisitIfMissing(client, "u1", visit(5))).rejects.toThrow("boom");
  });
});

/** A stand-in for `from("visits").update(...).eq().eq().select()`. */
function updateClient(result: { data: unknown[] | null; error: { message: string } | null }) {
  const update = vi.fn(() => ({
    eq: () => ({ eq: () => ({ select: async () => result }) }),
  }));
  return { client: { from: () => ({ update }) } as unknown as SupabaseClient, update };
}

describe("updateVisitDetails", () => {
  it("only sends the editable fields", async () => {
    const { client, update } = updateClient({ data: [{ post_office_id: 5 }], error: null });
    await updateVisitDetails(client, "u1", { ...visit(5), note: "n", isPublic: true });
    expect(update).toHaveBeenCalledWith({ note: "n", photo_path: null, is_public: true });
  });

  it("fails instead of recreating a visit that was removed elsewhere", async () => {
    const { client } = updateClient({ data: [], error: null });
    await expect(updateVisitDetails(client, "u1", visit(5))).rejects.toThrow(/removed/i);
  });

  it("throws the database error message", async () => {
    const { client } = updateClient({ data: null, error: { message: "nope" } });
    await expect(updateVisitDetails(client, "u1", visit(5))).rejects.toThrow("nope");
  });
});
