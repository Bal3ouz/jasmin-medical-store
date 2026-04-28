export function slugify(input: string): string {
  return (
    input
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "OE")
      .normalize("NFD")
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: NFD-decomposed combining marks (U+0300–U+036F) are intentionally targeted
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
