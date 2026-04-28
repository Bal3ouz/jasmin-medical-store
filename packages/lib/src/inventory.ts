export type StockStatus = "in_stock" | "low" | "out";

export interface StockInput {
  onHand: number;
  reorderPoint: number;
}

export function deriveStockStatus({ onHand, reorderPoint }: StockInput): StockStatus {
  if (onHand <= 0) return "out";
  if (onHand <= reorderPoint) return "low";
  return "in_stock";
}
