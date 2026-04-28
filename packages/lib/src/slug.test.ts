import { describe, expect, test } from "bun:test";
import { slugify } from "./slug";

describe("slugify", () => {
  test("lowercases and hyphenates spaces", () => {
    expect(slugify("Crème Anti-Imperfections")).toBe("creme-anti-imperfections");
  });

  test("strips French accents (é, è, ê, à, ç)", () => {
    expect(slugify("Hydrance Crème Visage")).toBe("hydrance-creme-visage");
  });

  test("collapses multiple spaces and dashes", () => {
    expect(slugify("Eau   Thermale -- Avène")).toBe("eau-thermale-avene");
  });

  test("strips leading and trailing dashes", () => {
    expect(slugify(" -SVR Sebiaclear- ")).toBe("svr-sebiaclear");
  });

  test("removes punctuation other than dash", () => {
    expect(slugify("L'Oréal: Soin 24h")).toBe("loreal-soin-24h");
  });

  test("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
