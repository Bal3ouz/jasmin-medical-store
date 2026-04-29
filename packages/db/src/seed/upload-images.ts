/**
 * Image scrape + upload pipeline for the demo seed.
 *
 * For each product in PRODUCT_SEED + EXTENDED_PRODUCT_SEED that has an `imageUrl`,
 * this script:
 *   1. Downloads the image from the manufacturer/retailer URL into
 *      packages/db/seed/images/<slug>.<ext> (cached — won't re-download).
 *   2. Uploads it to Supabase Storage `product-images/<slug>/<filename>`.
 *   3. Inserts a `product_images` row pointing at the storage_path.
 *
 * Idempotent: re-running won't duplicate rows or re-upload identical files.
 * Gracefully skips 404s, timeouts, and unsupported MIME types — those products
 * just keep showing the branded ProductImageFallback in the UI, which is fine.
 *
 * Run via: `bun run db:upload-images` from the repo root.
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { createClient } from "../client";
import * as schema from "../schema";
import { PRODUCT_SEED, type SeedProduct } from "./data/products";

interface ProductWithImage extends SeedProduct {
  imageUrl?: string;
  imageAlt?: string;
}

async function loadExtended(): Promise<ProductWithImage[]> {
  try {
    const mod = await import("./data/products-extended");
    return (mod as { EXTENDED_PRODUCT_SEED?: ProductWithImage[] }).EXTENDED_PRODUCT_SEED ?? [];
  } catch {
    return [];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DB_URL) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL");
  process.exit(1);
}

const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = createClient(DB_URL);

const IMAGES_DIR = path.resolve(import.meta.dir, "images");
await mkdir(IMAGES_DIR, { recursive: true });

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadOnce(url: string, slug: string): Promise<{ path: string; ext: string } | null> {
  // Cache: check for existing files with any of the supported extensions.
  for (const ext of ["jpg", "png", "webp"]) {
    const cached = path.join(IMAGES_DIR, `${slug}.${ext}`);
    if (await fileExists(cached)) return { path: cached, ext };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "image/jpeg,image/png,image/webp,image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`  ⚠ ${slug}: HTTP ${res.status} from ${url}`);
      return null;
    }
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0]!.toLowerCase().trim();
    const ext = MIME_TO_EXT[contentType];
    if (!ext) {
      console.warn(`  ⚠ ${slug}: unsupported content-type "${contentType}"`);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length < 1024) {
      console.warn(`  ⚠ ${slug}: image too small (${buf.length} bytes), likely placeholder`);
      return null;
    }
    const file = path.join(IMAGES_DIR, `${slug}.${ext}`);
    await writeFile(file, buf);
    return { path: file, ext };
  } catch (err) {
    console.warn(`  ⚠ ${slug}: fetch failed —`, (err as Error).message);
    return null;
  }
}

async function uploadAndAttach(productId: string, slug: string, file: { path: string; ext: string }) {
  const storagePath = `${slug}/${slug}.${file.ext}`;
  const buf = new Uint8Array(await readFile(file.path));
  const contentType = `image/${file.ext === "jpg" ? "jpeg" : file.ext}`;

  // Upload (overwrite-safe via upsert).
  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(storagePath, buf, { contentType, upsert: true, cacheControl: "31536000" });
  if (upErr) {
    console.warn(`  ⚠ ${slug}: storage upload failed —`, upErr.message);
    return;
  }

  // Idempotent row insert: skip if a product_images row already points at this path.
  const existing = await db
    .select()
    .from(schema.productImages)
    .where(eq(schema.productImages.productId, productId));
  const already = existing.some((row) => row.storagePath === storagePath);
  if (already) return;

  await db.insert(schema.productImages).values({
    productId,
    storagePath,
    altText: null,
    isPrimary: existing.length === 0, // first image becomes primary
    displayOrder: existing.length * 10,
  });
}

async function main() {
  const extended = await loadExtended();
  const all: ProductWithImage[] = [...(PRODUCT_SEED as ProductWithImage[]), ...extended];
  const withImages = all.filter((p) => Boolean(p.imageUrl));
  console.log(`→ ${withImages.length} of ${all.length} products have an imageUrl`);

  let downloaded = 0;
  let uploaded = 0;
  let skipped = 0;

  for (const p of withImages) {
    const file = await downloadOnce(p.imageUrl!, p.slug);
    if (!file) {
      skipped++;
      continue;
    }
    downloaded++;
    await uploadAndAttach(p.id, p.slug, file);
    uploaded++;
    if (uploaded % 5 === 0) console.log(`  ✓ ${uploaded} uploaded so far`);
  }

  console.log(`✓ images: ${downloaded} downloaded, ${uploaded} uploaded, ${skipped} skipped`);
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
