import { describe, expect, test } from "bun:test";
import { generateOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  test("formats year + zero-padded sequence as JMS-YYYY-NNNNNN", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1 })).toBe("JMS-2026-000001");
  });

  test("pads up to 6 digits", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1234 })).toBe("JMS-2026-001234");
  });

  test("does not truncate sequences above 999999", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1234567 })).toBe("JMS-2026-1234567");
  });
});
