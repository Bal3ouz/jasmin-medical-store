/**
 * Order state machine for the admin back-office.
 *
 * The string literal unions here MUST stay in lockstep with the
 * `order_status` and `staff_role` Postgres enums declared in
 * `packages/db/src/schema/_enums.ts`. We mirror them locally instead of
 * importing from `@jasmin/db` because `@jasmin/db` already depends on
 * `@jasmin/lib` (cycle).
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type StaffRole = "admin" | "manager" | "cashier" | "stock";

type TransitionMap = Record<OrderStatus, Partial<Record<OrderStatus, StaffRole[]>>>;

export const ORDER_TRANSITIONS: TransitionMap = {
  pending: {
    confirmed: ["cashier", "manager", "admin"],
    cancelled: ["admin", "manager"],
  },
  confirmed: {
    preparing: ["cashier", "manager", "admin"],
    cancelled: ["admin", "manager"],
  },
  preparing: {
    shipped: ["cashier", "manager", "admin"],
    cancelled: ["admin"],
  },
  shipped: {
    delivered: ["cashier", "manager", "admin"],
    refunded: ["admin"],
    cancelled: ["admin"],
  },
  delivered: {
    refunded: ["admin"],
  },
  cancelled: {},
  refunded: {},
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: StaffRole,
): boolean {
  const roles = ORDER_TRANSITIONS[from]?.[to];
  return Array.isArray(roles) && roles.includes(role);
}

export function allowedNextStates(
  from: OrderStatus,
  role: StaffRole,
): OrderStatus[] {
  return Object.entries(ORDER_TRANSITIONS[from] ?? {})
    .filter(([, roles]) => Array.isArray(roles) && roles.includes(role))
    .map(([s]) => s as OrderStatus);
}

export const STATUS_TIMESTAMP_COLUMN: Partial<Record<OrderStatus, string>> = {
  confirmed: "confirmed_at",
  shipped: "shipped_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};
