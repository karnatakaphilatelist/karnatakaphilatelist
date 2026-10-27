import { describe, expect, it } from "vitest";
import { formatPlaceName } from "@/lib/format";

describe("formatPlaceName", () => {
  it.each([
    ["agumbe so", "Agumbe SO"],
    ["Ballary Fort SO", "Ballary Fort SO"],
    ["Gadag Ho", "Gadag HO"],
    ["karkala h o", "Karkala HO"],
    ["kaup s o", "Kaup SO"],
    ["varanga b o", "Varanga BO"],
    ["Ranebennur mdg", "Ranebennur MDG"],
    ["NAL SO", "NAL SO"],
    ["museum Road SO", "Museum Road SO"],
    ["jayanagar 3rd block so", "Jayanagar 3rd Block SO"],
    ["the high court of karnataka - high court so", "The High Court of Karnataka - High Court SO"],
    ["the vidana soudha - bengaluru gpo pb", "The Vidana Soudha - Bengaluru GPO PB"],
  ])("formats %j as %j", (input, expected) => {
    expect(formatPlaceName(input)).toBe(expected);
  });

  it("formats districts written in different cases the same way", () => {
    expect(formatPlaceName("hassan")).toBe("Hassan");
    expect(formatPlaceName("Hassan")).toBe("Hassan");
    expect(formatPlaceName("HASSAN")).toBe("Hassan");
    expect(formatPlaceName("Dakshina Kannada")).toBe("Dakshina Kannada");
  });

  it("collapses stray spaces", () => {
    expect(formatPlaceName("  bengaluru   urban ")).toBe("Bengaluru Urban");
  });

  it("keeps hyphenated words and an empty name safe", () => {
    expect(formatPlaceName("kodagu-madikeri ho")).toBe("Kodagu-Madikeri HO");
    expect(formatPlaceName("")).toBe("");
  });

  it("does not change the spelling", () => {
    expect(formatPlaceName("vjaypura")).toBe("Vjaypura");
  });
});
