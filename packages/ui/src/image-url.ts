const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "product-images";

/**
 * Build a public URL for a product image stored in Supabase Storage.
 * Returns null if the input is null/empty so the caller renders the fallback.
 */
export function getImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
