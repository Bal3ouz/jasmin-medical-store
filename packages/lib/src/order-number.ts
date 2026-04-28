export interface OrderNumberInput {
  year: number;
  sequence: number;
}

export function generateOrderNumber({ year, sequence }: OrderNumberInput): string {
  if (!Number.isInteger(year) || !Number.isInteger(sequence) || sequence < 0 || year < 0) {
    throw new RangeError(
      `generateOrderNumber: year and sequence must be non-negative integers (got year=${year}, sequence=${sequence})`,
    );
  }
  return `JMS-${year}-${String(sequence).padStart(6, "0")}`;
}
