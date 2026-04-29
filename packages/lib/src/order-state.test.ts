import { describe, expect, test } from "bun:test";
import { allowedNextStates, canTransition } from "./order-state";

describe("canTransition", () => {
  test("admin can rewind shipped → preparing? No — there is no defined edge", () => {
    expect(canTransition("shipped", "preparing", "admin")).toBe(false);
  });

  test("cashier can confirm a pending order", () => {
    expect(canTransition("pending", "confirmed", "cashier")).toBe(true);
  });

  test("cashier cannot cancel a confirmed order", () => {
    expect(canTransition("confirmed", "cancelled", "cashier")).toBe(false);
  });

  test("manager can cancel a confirmed order", () => {
    expect(canTransition("confirmed", "cancelled", "manager")).toBe(true);
  });

  test("only admin can refund a delivered order", () => {
    expect(canTransition("delivered", "refunded", "admin")).toBe(true);
    expect(canTransition("delivered", "refunded", "manager")).toBe(false);
    expect(canTransition("delivered", "refunded", "cashier")).toBe(false);
  });

  test("terminal states have no outgoing transitions", () => {
    expect(canTransition("cancelled", "pending", "admin")).toBe(false);
    expect(canTransition("refunded", "delivered", "admin")).toBe(false);
  });

  test("stock role cannot transition orders", () => {
    expect(canTransition("pending", "confirmed", "stock")).toBe(false);
  });
});

describe("allowedNextStates", () => {
  test("admin from pending: confirmed + cancelled", () => {
    expect(allowedNextStates("pending", "admin").sort()).toEqual([
      "cancelled",
      "confirmed",
    ]);
  });

  test("cashier from shipped: delivered only", () => {
    expect(allowedNextStates("shipped", "cashier")).toEqual(["delivered"]);
  });

  test("admin from delivered: refunded only", () => {
    expect(allowedNextStates("delivered", "admin")).toEqual(["refunded"]);
  });

  test("any role from cancelled: empty", () => {
    expect(allowedNextStates("cancelled", "admin")).toEqual([]);
  });
});
