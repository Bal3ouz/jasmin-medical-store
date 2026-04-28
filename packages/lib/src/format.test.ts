import { describe, expect, test } from "bun:test";
import { formatTND, formatTNDFromMillimes } from "./format";

describe("formatTND", () => {
  test("formats whole-dinar prices with three-decimal millimes", () => {
    expect(formatTND(32.9)).toBe("32,900 TND");
  });

  test("formats prices with millimes precision", () => {
    expect(formatTND(5.005)).toBe("5,005 TND");
  });

  test("formats zero", () => {
    expect(formatTND(0)).toBe("0,000 TND");
  });

  test("formats large prices with thousand separator (narrow no-break space U+202F)", () => {
    // Bun 1.3.11 / ICU: Intl.NumberFormat("fr-TN") uses U+202F (narrow no-break space) as group separator
    expect(formatTND(1234.5)).toBe("1 234,500 TND");
  });

  test("rejects NaN", () => {
    expect(() => formatTND(Number.NaN)).toThrow(RangeError);
  });

  test("rejects Infinity", () => {
    expect(() => formatTND(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("formatTNDFromMillimes", () => {
  test("converts integer millimes to TND string", () => {
    expect(formatTNDFromMillimes(32900)).toBe("32,900 TND");
  });

  test("handles zero millimes", () => {
    expect(formatTNDFromMillimes(0)).toBe("0,000 TND");
  });
});
