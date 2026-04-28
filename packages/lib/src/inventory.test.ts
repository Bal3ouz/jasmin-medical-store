import { describe, expect, test } from "bun:test";
import { deriveStockStatus } from "./inventory";

describe("deriveStockStatus", () => {
  test("returns 'out' when on_hand is 0", () => {
    expect(deriveStockStatus({ onHand: 0, reorderPoint: 5 })).toBe("out");
  });

  test("returns 'low' when on_hand is at or below reorder point", () => {
    expect(deriveStockStatus({ onHand: 5, reorderPoint: 5 })).toBe("low");
    expect(deriveStockStatus({ onHand: 3, reorderPoint: 5 })).toBe("low");
  });

  test("returns 'in_stock' when on_hand is above reorder point", () => {
    expect(deriveStockStatus({ onHand: 6, reorderPoint: 5 })).toBe("in_stock");
    expect(deriveStockStatus({ onHand: 100, reorderPoint: 5 })).toBe("in_stock");
  });

  test("treats negative on_hand defensively as 'out'", () => {
    expect(deriveStockStatus({ onHand: -1, reorderPoint: 5 })).toBe("out");
  });
});
