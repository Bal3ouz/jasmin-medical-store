const TND_FORMATTER = new Intl.NumberFormat("fr-TN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
  useGrouping: true,
});

export function formatTND(amount: number): string {
  return `${TND_FORMATTER.format(amount)} TND`;
}

export function formatTNDFromMillimes(millimes: number): string {
  return formatTND(millimes / 1000);
}
