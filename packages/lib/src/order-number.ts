export interface OrderNumberInput {
  year: number;
  sequence: number;
}

export function generateOrderNumber({ year, sequence }: OrderNumberInput): string {
  return `JMS-${year}-${String(sequence).padStart(6, "0")}`;
}
