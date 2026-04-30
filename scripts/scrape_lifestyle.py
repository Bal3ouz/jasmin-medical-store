"""
One-shot: pull a handful of lifestyle/people photos for hero & sections.
Uses Bing image search (HTML scrape) to find royalty-free CC-style photos.

Usage:
    python3 scripts/scrape_lifestyle.py
"""

from __future__ import annotations

import json
import os
import random
import re
import sys
import time
from urllib.parse import quote_plus

import httpx

UAS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]
BING_M_RE = re.compile(r'class="iusc"[^>]*m="([^"]+)"')


def headers() -> dict[str, str]:
    return {
        "User-Agent": random.choice(UAS),
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }


def bing_search(query: str, count: int = 12) -> list[dict]:
    url = (
        f"https://www.bing.com/images/search?q={quote_plus(query)}"
        "&form=HDRSC2&first=1&qft=+filterui:photo-photo+filterui:imagesize-large+filterui:license-L1"
    )
    with httpx.Client(timeout=30, headers=headers(), follow_redirects=True) as c:
        r = c.get(url)
    if r.status_code != 200:
        return []
    out = []
    for m in BING_M_RE.finditer(r.text):
        raw = m.group(1).replace("&quot;", '"').replace("&amp;", "&")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if "murl" in data:
            out.append(data)
        if len(out) >= count:
            break
    return out


def fetch(url: str) -> tuple[bytes, str] | None:
    try:
        with httpx.Client(timeout=20, headers=headers(), follow_redirects=True) as c:
            r = c.get(url)
        if r.status_code != 200:
            return None
        ct = r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        if "image" not in ct or len(r.content) < 30_000:
            return None
        return r.content, ct
    except httpx.HTTPError:
        return None


WANTED = [
    # (filename, query, description)
    ("hero-ritual.jpg", "woman skincare ritual face mask spa peaceful", "hero — peaceful skincare ritual"),
    ("hero-mediterranean.jpg", "mediterranean woman natural beauty olive skin smiling sunlight", "alt hero — Mediterranean warmth"),
    ("hands-serum.jpg", "hands holding skincare serum bottle natural light close-up", "section accent — hands + product"),
    ("baby-bath.jpg", "mother bathing baby tender warm gentle natural light", "Mustela section — baby care"),
    ("happy-family.jpg", "family generations grandmother mother daughter smiling natural", "trust strip — family wellbeing"),
    ("zen-stones.jpg", "zen spa stones eucalyptus calm wellness atmosphere", "sensorial moment alt"),
]

OUT = "/Users/ghaith.belaazi/dev/jasmin-medical-store/apps/web/public/lifestyle"


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    for fname, query, _desc in WANTED:
        target = f"{OUT}/{fname}"
        if os.path.exists(target) and os.path.getsize(target) > 30_000:
            print(f"  · {fname} exists, skip")
            continue
        print(f"→ {fname}: '{query}'")
        results = bing_search(query)
        downloaded = False
        for hit in results:
            url = hit.get("murl") or ""
            if any(bad in url.lower() for bad in ["pinterest", "tiktok", "facebook"]):
                continue
            blob = fetch(url)
            if not blob:
                continue
            content, ct = blob
            with open(target, "wb") as f:
                f.write(content)
            kb = len(content) // 1024
            print(f"   ✓ {ct} ({kb}KB) ← {url[:80]}")
            downloaded = True
            break
        if not downloaded:
            print("   ✗ none acceptable")
        time.sleep(0.5)
    return 0


if __name__ == "__main__":
    sys.exit(main())
