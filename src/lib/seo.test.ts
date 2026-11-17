import { describe, expect, it } from "vitest";
import {
  findOfficeBySlug,
  nearestOffices,
  officePath,
  officeSlug,
  stateNameFor,
} from "@/lib/seo";
import type { PostOffice } from "@/types";

const office = (over: Partial<PostOffice> & { id: number }): PostOffice => ({
  name: "Agumbe SO",
  pincode: "577411",
  district: "Shivamogga",
  state: "KA",
  lat: 13.5085,
  lng: 75.0934,
  stampImagePath: null,
  ...over,
});

describe("officeSlug", () => {
  it("joins the name and pincode", () => {
    expect(officeSlug(office({ id: 1 }))).toBe("agumbe-so-577411");
    expect(officePath(office({ id: 1 }))).toBe("/offices/agumbe-so-577411");
  });

  it("keeps offices with the same name apart by pincode", () => {
    const a = office({ id: 1, name: "Kodigehalli SO", pincode: "560092" });
    const b = office({ id: 2, name: "Kodigehalli SO", pincode: "571234" });
    expect(officeSlug(a)).not.toBe(officeSlug(b));
  });

  it("falls back to the id when the pincode is missing", () => {
    expect(officeSlug(office({ id: 9, pincode: "" }))).toBe("agumbe-so-9");
  });

  it("strips accents and punctuation", () => {
    expect(officeSlug(office({ id: 1, name: "St. Mary's Isle (BO)" }))).toBe(
      "st-mary-s-isle-bo-577411"
    );
  });
});

describe("findOfficeBySlug", () => {
  it("finds an office and returns undefined for an unknown slug", () => {
    const list = [office({ id: 1 })];
    expect(findOfficeBySlug(list, "agumbe-so-577411")?.id).toBe(1);
    expect(findOfficeBySlug(list, "nope")).toBeUndefined();
  });
});

describe("nearestOffices", () => {
  const here = office({ id: 1 });
  const near = office({ id: 2, name: "Near", pincode: "1", lat: 13.51, lng: 75.1 });
  const far = office({ id: 3, name: "Far", pincode: "2", lat: 15, lng: 76 });
  const unmapped = office({ id: 4, name: "Unmapped", pincode: "3", lat: null, lng: null });

  it("sorts nearest first, excludes itself and unmapped offices, and limits the count", () => {
    const result = nearestOffices(here, [far, here, unmapped, near], 5);
    expect(result.map((r) => r.office.id)).toEqual([2, 3]);
    expect(nearestOffices(here, [far, near], 1)).toHaveLength(1);
  });

  it("returns nothing when the office itself has no coordinates", () => {
    expect(nearestOffices(unmapped, [here, near], 3)).toEqual([]);
  });
});

describe("stateNameFor", () => {
  it("maps a state code to its name", () => {
    expect(stateNameFor(office({ id: 1 }))).toBe("Karnataka");
  });
});
