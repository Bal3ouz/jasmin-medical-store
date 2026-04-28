import { describe, expect, test } from "bun:test";
import { ProductInsertSchema } from "./product";

describe("ProductInsertSchema", () => {
  test("accepts a valid flat product", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "svr-sebiaclear",
      name: "SVR Sebiaclear Crème",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: false,
      sku: "SVR-SC-001",
      priceTnd: "32.900",
    });
    expect(result.success).toBe(true);
  });

  test("rejects flat product missing sku", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "x",
      name: "x",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: false,
      priceTnd: "1.000",
    });
    expect(result.success).toBe(false);
  });

  test("rejects variant product with sku/price set", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "x",
      name: "x",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: true,
      sku: "SHOULD-NOT-BE-HERE",
      priceTnd: "1.000",
    });
    expect(result.success).toBe(false);
  });
});
