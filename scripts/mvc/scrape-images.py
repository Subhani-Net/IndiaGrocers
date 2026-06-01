"""
Veenas.com Image Scraper v2 — Raw HTML approach

Uses regex on raw HTML to find product image URLs, then uses
keyword proximity matching to pick the correct product image.

Usage: python scripts/mvc/scrape-images.py
"""

import requests
import re
import os
import time
import urllib.parse

ROOT = r"D:\Dump\IndiaGrocers-Fix"
IMG_DIR = os.path.join(ROOT, "apps", "storefront", "public", "images")
PRODUCTS_FILE = os.path.join(ROOT, "catalogue-build", "products-with-noimages.md")
NOT_FOUND_FILE = os.path.join(ROOT, "catalogue-build", "images-not-found.md")

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
})

def slugify(text):
    return text.lower().replace("&", "and").replace("'", "").replace('"', "").replace("(", "").replace(")", "").replace(",", "").replace(".", "").replace("  ", " ").strip().replace(" ", "-")

def read_products():
    if not os.path.exists(PRODUCTS_FILE):
        print(f"File not found: {PRODUCTS_FILE}")
        return []
    with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
        products = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    print(f"Loaded {len(products)} products from list\n")
    return products

def extract_product_images(html):
    """Extract all unique product image URLs from veenas search results HTML"""
    # Match: //veenas.com/cdn/shop/products/NAME.jpg?v=NUMBER&width=...
    pattern = r'//veenas\.com/cdn/shop/products/([^\s"\']+?\.(?:jpg|png|webp|jpeg))(?:\?[^\s"\'>]*)?'
    matches = re.findall(pattern, html, re.IGNORECASE)
    
    # Deduplicate and prepend https:
    seen = set()
    urls = []
    for m in matches:
        base = m.split("?")[0].split("&")[0]  # strip query params for dedup
        if base not in seen:
            seen.add(base)
            url = "https://veenas.com/cdn/shop/products/" + m.split("?")[0]
            urls.append(url)
    return urls

def extract_image_alt_map(html):
    """Extract mapping of image URL -> alt text from HTML"""
    # Find img tags with both src and alt
    pattern = r'<img[^>]*?src\s*=\s*["\']([^"\']*?)["\'][^>]*?alt\s*=\s*["\']([^"\']*?)["\']'
    matches = re.findall(pattern, html[:50000], re.IGNORECASE)  # First 50K chars
    
    # Also try reverse order (alt before src)
    pattern2 = r'<img[^>]*?alt\s*=\s*["\']([^"\']*?)["\'][^>]*?src\s*=\s*["\']([^"\']*?)["\']'
    matches2 = re.findall(pattern2, html[:50000], re.IGNORECASE)
    
    alt_map = {}
    for src, alt in matches:
        if "cdn.shop" in src or "veenas.com" in src:
            alt_map[src] = alt
    for alt, src in matches2:
        if "cdn.shop" in src or "veenas.com" in src:
            alt_map[src] = alt
    
    return alt_map

def search_and_download(product_name):
    """Search veenas and download first matching product image"""
    query = urllib.parse.quote(product_name)
    url = f"https://veenas.com/search?q={query}&options%5Bprefix%5D=last"

    try:
        resp = SESSION.get(url, timeout=20)
        if resp.status_code != 200:
            print(f"  HTTP {resp.status_code}")
            return False
    except Exception as e:
        print(f"  Request failed: {e}")
        return False

    html = resp.text
    
    # Extract product images
    image_urls = extract_product_images(html)
    if not image_urls:
        print(f"  No product images found on page")
        return False

    # Extract alt text mapping
    alt_map = extract_image_alt_map(html)

    # Build keyword list
    keywords = product_name.lower().split()
    stop = {"the", "a", "an", "of", "and", "in", "on", "at", "to", "for", "with", "is", "by", "buy", "veenas", "com", "online", "indian", "grocery", "store", "uk"}
    keywords = [w for w in keywords if w not in stop]

    # Score each image by keyword match in alt text (first image = best match per page layout)
    best_url = None
    best_score = 0
    best_alt = ""

    for img_url in image_urls[:20]:  # Only check first 20 images (search results page order)
        alt = ""
        # Try to find matching alt text
        for src_prefix, alt_text in alt_map.items():
            if img_url.split("/")[-1].split("?")[0] in src_prefix:
                alt = alt_text
                break

        score = sum(1 for kw in keywords if kw in (alt or "").lower())
        
        if score > best_score or (score == best_score and best_url is None):
            best_score = score
            best_url = img_url
            best_alt = alt

        # If we have a good enough match, stop
        if best_score >= len(keywords) * 0.5:
            break

    if not best_url:
        print(f"  No matching image found")
        return False

    # If no alt text matched, fall back to first product image
    if best_score == 0 and len(image_urls) > 0:
        best_url = image_urls[0]
        best_alt = "(fallback - first result)"

    # Download
    try:
        img_resp = SESSION.get(best_url, timeout=15)
        if img_resp.status_code != 200:
            print(f"  Download failed: HTTP {img_resp.status_code}")
            return False
    except Exception as e:
        print(f"  Download error: {e}")
        return False

    # Generate filename
    ext_match = re.search(r'\.(jpg|jpeg|png|webp|gif)(?:\?|$)', best_url, re.IGNORECASE)
    ext = (ext_match.group(1) or "jpg").lower()
    if ext == "jpeg": ext = "jpg"

    filename = slugify(product_name) + "." + ext
    filepath = os.path.join(IMG_DIR, filename)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(img_resp.content)

    size_kb = len(img_resp.content) / 1024
    print(f"  OK -> {filename} ({size_kb:.0f} KB) score={best_score}/{len(keywords)}")
    return True

def main():
    print("=" * 60)
    print("  Veenas.com Image Scraper v2")
    print("=" * 60)

    products = read_products()
    if not products:
        return

    found = 0
    not_found = []
    skipped = 0

    os.makedirs(IMG_DIR, exist_ok=True)

    for i, name in enumerate(products):
        print(f"[{i+1}/{len(products)}] {name}")

        fname = slugify(name)
        if any(os.path.exists(os.path.join(IMG_DIR, f"{fname}.{e}")) for e in ["jpg", "png", "webp"]):
            print(f"  Already exists")
            skipped += 1
            continue

        if search_and_download(name):
            found += 1
        else:
            not_found.append(name)

        time.sleep(0.8)

    print("\n" + "=" * 60)
    print(f"Done: {found} found, {len(not_found)} not found, {skipped} skipped")

    if not_found:
        print(f"\nNot found ({len(not_found)}):")
        for n in not_found:
            print(f"  - {n}")
        with open(NOT_FOUND_FILE, "w", encoding="utf-8") as f:
            f.write("# Images NOT found on veenas.com\n")
            f.write("# Generated by scripts/mvc/scrape-images.py\n\n")
            for n in not_found:
                f.write(n + "\n")
        print(f"\nMissing list: {NOT_FOUND_FILE}")

    print("=" * 60)

if __name__ == "__main__":
    main()
