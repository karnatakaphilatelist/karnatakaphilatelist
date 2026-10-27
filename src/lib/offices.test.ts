import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/cache", () => cache);

const db = vi.hoisted(() => ({
  responses: [] as { data: unknown[] | null; error: { code?: string; message: string } | null }[],
  queries: [] as string[],
}));
vi.mock("@/lib/supabase/public", () => ({
  createSupabasePublicClient: () => ({
    from: () => ({
      select: (columns: string) => {
        db.queries.push(columns);
        return {
          order: () => ({
            overrideTypes: async () =>
              db.responses.shift() ?? { data: null, error: { message: "no response queued" } },
          }),
        };
      },
    }),
  }),
}));

import snapshot from "@/data/post-offices.snapshot.json";
import { getPostOffices } from "@/lib/offices";

beforeEach(() => {
  cache.cacheLife.mockReset();
  cache.cacheTag.mockReset();
  db.responses = [];
  db.queries = [];
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const row = (id: number, name: string, extra = {}) => ({
  id,
  name,
  pincode: 560001,
  district: "bengaluru urban",
  lat: 12.9,
  lng: 77.5,
  ...extra,
});

describe("getPostOffices", () => {
  it("returns formatted offices from the database and caches them for hours", async () => {
    db.responses = [
      { data: [row(2, "museum road so"), row(1, "Basavangudi h o", { stamp_image_path: "1.webp" })], error: null },
    ];

    const offices = await getPostOffices();

    expect(offices.map((office) => office.name)).toEqual(["Basavangudi HO", "Museum Road SO"]);
    expect(offices[0]).toMatchObject({
      id: 1,
      pincode: "560001",
      district: "Bengaluru Urban",
      stampImagePath: "1.webp",
    });
    expect(cache.cacheTag).toHaveBeenCalledWith("post-offices");
    expect(cache.cacheLife).toHaveBeenCalledTimes(1);
    expect(cache.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("falls back to the plain columns before the stamp-images migration has run", async () => {
    db.responses = [
      { data: null, error: { code: "42703", message: "column does not exist" } },
      { data: [row(1, "Hampi SO")], error: null },
    ];

    const offices = await getPostOffices();

    expect(db.queries).toHaveLength(2);
    expect(db.queries[0]).toContain("stamp_image_path");
    expect(db.queries[1]).not.toContain("stamp_image_path");
    expect(offices[0].stampImagePath).toBeNull();
    expect(cache.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("uses the bundled list, cached only briefly, when the database cannot be reached", async () => {
    db.responses = [{ data: null, error: { message: "TypeError: fetch failed" } }];

    const offices = await getPostOffices();

    expect(offices).toHaveLength(snapshot.length);
    expect(cache.cacheLife).toHaveBeenCalledTimes(1);
    expect(cache.cacheLife).toHaveBeenCalledWith("minutes");
    expect(console.error).toHaveBeenCalled();
  });

  it("treats an empty table as an outage rather than showing no post offices", async () => {
    db.responses = [{ data: [], error: null }];

    const offices = await getPostOffices();

    expect(offices.length).toBeGreaterThan(0);
    expect(cache.cacheLife).toHaveBeenCalledWith("minutes");
  });
});

describe("the bundled list", () => {
  it("has unique ids and the fields the app needs", () => {
    const ids = snapshot.map((office) => office.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const office of snapshot) {
      expect(Number.isInteger(office.id)).toBe(true);
      expect(office.name.trim().length).toBeGreaterThan(0);
      expect(office.district.trim().length).toBeGreaterThan(0);
      expect(office.pincode).toMatch(/^\d{6}$/);
      // Roughly inside Karnataka's bounding box.
      expect(office.lat).toBeGreaterThan(11);
      expect(office.lat).toBeLessThan(19);
      expect(office.lng).toBeGreaterThan(74);
      expect(office.lng).toBeLessThan(79);
    }
  });

  it("is sorted and formatted the same way as live data", async () => {
    db.responses = [{ data: null, error: { message: "down" } }];
    const offices = await getPostOffices();
    const names = offices.map((office) => office.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    expect(offices.find((office) => office.id === 61)?.name).toBe("Agumbe SO");
    expect(offices.find((office) => office.id === 66)?.name).toBe("Karkala HO");
    expect(offices.find((office) => office.id === 61)?.district).toBe("Shivamogga");
  });
});

describe("district spellings in the bundled list", () => {
  it("has none of the known misspellings", () => {
    const districts = new Set(snapshot.map((office) => office.district.toLowerCase()));
    for (const wrong of ["vjaypura", "shivmogga", "chikkamangaluru"]) {
      expect(districts.has(wrong)).toBe(false);
    }
  });
});
