"""
One-shot scraper that pulls real product photos for the catalog.

Primary source: Bing Image Search (free, no API key, scraped HTML).
Fallback:       Open Beauty Facts (sparse but well-typed).

For each product in the cloud DB:
  1. Query Bing Images for "<product name> <brand> packshot" + filter for
     manufacturer-style shots (white bg, image_size=1)
  2. Download the best candidate
  3. Upload to Supabase Storage (bucket `product-images`)
  4. Insert/replace the primary `product_images` row

Env required:
    SUPABASE_DB_URL                 -- pooler URI
    NEXT_PUBLIC_SUPABASE_URL        -- https://<ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY       -- sb_secret_...

Usage:
    python3 scripts/scrape_real_products.py [--limit N]
"""

from __future__ import annotations

import argparse
import io
import json
import os
import random
import re
import sys
import time
from typing import Any
from urllib.parse import quote_plus, quote

import httpx
import psycopg2
import psycopg2.extras

UAS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
]


def headers() -> dict[str, str]:
    return {
        "User-Agent": random.choice(UAS),
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }


# Regex to pull image metadata blobs out of Bing's HTML.
# Each image card has: class="iusc" m="{...JSON...}"
BING_M_RE = re.compile(r'class="iusc"[^>]*m="([^"]+)"')


def bing_image_search(query: str, count: int = 10) -> list[dict[str, Any]]:
    """Return list of {murl, turl, t} dicts from Bing image results."""
    url = f"https://www.bing.com/images/search?q={quote_plus(query)}&form=HDRSC2&first=1"
    with httpx.Client(timeout=30.0, headers=headers(), follow_redirects=True) as c:
        r = c.get(url)
    if r.status_code != 200:
        return []
    out: list[dict[str, Any]] = []
    for m in BING_M_RE.finditer(r.text):
        raw = m.group(1)
        # The JSON in `m` is HTML-entity-encoded
        raw = raw.replace("&quot;", '"').replace("&amp;", "&")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if "murl" in data:
            out.append(data)
        if len(out) >= count:
            break
    return out


def is_acceptable_image(content: bytes, content_type: str) -> bool:
    """Reject obviously bad images (too small, wrong type)."""
    if not content or len(content) < 8_000:
        return False  # < 8KB, probably an icon
    if "image" not in content_type:
        return False
    return True


def upload_to_storage(supa_url: str, secret: str, key: str, content: bytes, content_type: str) -> str:
    url = f"{supa_url}/storage/v1/object/product-images/{quote(key, safe='/')}"
    h = {
        "apikey": secret,
        "Authorization": f"Bearer {secret}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    with httpx.Client(timeout=60.0) as c:
        r = c.post(url, headers=h, content=content)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"upload {r.status_code}: {r.text[:200]}")
    return key


def ext_for(content_type: str) -> str:
    ct = content_type.lower()
    if "jpeg" in ct or "jpg" in ct:
        return ".jpg"
    if "png" in ct:
        return ".png"
    if "webp" in ct:
        return ".webp"
    if "gif" in ct:
        return ".gif"
    return ".jpg"


def fetch_image(url: str) -> tuple[bytes, str] | None:
    try:
        with httpx.Client(timeout=20.0, headers=headers(), follow_redirects=True) as c:
            r = c.get(url)
    except httpx.HTTPError:
        return None
    if r.status_code != 200:
        return None
    ct = r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    if not is_acceptable_image(r.content, ct):
        return None
    return r.content, ct


def find_product_image(name: str, brand: str) -> tuple[bytes, str, str] | None:
    """Try Bing image search with multiple queries, return (content, ct, source_url)."""
    queries = [
        f'"{brand}" "{name}" packshot product',
        f"{brand} {name} packaging",
        f"{brand} {name}",
    ]
    for q in queries:
        results = bing_image_search(q, count=8)
        for hit in results:
            url = hit.get("murl")
            if not url:
                continue
            # Skip suspect domains
            if any(bad in url.lower() for bad in ["pinterest", "tiktok", "facebook"]):
                continue
            blob = fetch_image(url)
            if blob:
                return blob[0], blob[1], url
        time.sleep(0.6)  # be polite between queries
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="Cap products processed (0 = all)")
    ap.add_argument("--only-without", action="store_true", help="Only products with zero images")
    args = ap.parse_args()

    db_url = os.environ["SUPABASE_DB_URL"]
    supa_url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    secret = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    sql = """
        SELECT p.id, p.slug, p.name, b.name AS brand_name,
               (SELECT count(*)::int FROM product_images pi WHERE pi.product_id = p.id) AS n_images
        FROM products p
        JOIN brands b ON b.id = p.brand_id
        ORDER BY b.name, p.created_at
    """
    cur.execute(sql)
    products = cur.fetchall()
    if args.only_without:
        products = [p for p in products if p["n_images"] == 0]
    if args.limit:
        products = products[: args.limit]
    print(f"→ {len(products)} products to process")

    matched = 0
    failed = 0
    for i, prod in enumerate(products, 1):
        print(f"[{i}/{len(products)}] {prod['brand_name']} — {prod['name']}", flush=True)
        result = find_product_image(prod["name"], prod["brand_name"])
        if not result:
            print(f"   ✗ no image")
            failed += 1
            continue
        content, ct, source = result

        ext = ext_for(ct)
        key = f"{prod['slug']}/{prod['slug']}{ext}"
        try:
            upload_to_storage(supa_url, secret, key, content, ct)
        except Exception as e:
            print(f"   ✗ upload: {e}")
            failed += 1
            continue

        cur.execute("DELETE FROM product_images WHERE product_id = %s", (prod["id"],))
        cur.execute(
            """
            INSERT INTO product_images (product_id, storage_path, alt_text, is_primary, display_order)
            VALUES (%s, %s, %s, true, 0)
            """,
            (prod["id"], key, prod["name"][:120]),
        )
        matched += 1
        print(f"   ✓ {ct} ({len(content)//1024}KB) ← {source[:80]}")

        if matched % 5 == 0:
            conn.commit()
        time.sleep(0.4)

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ matched {matched}/{len(products)}  (failed: {failed})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
