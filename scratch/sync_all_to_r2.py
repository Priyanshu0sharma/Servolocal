import os
import re
import urllib.request
import boto3
import dotenv
import psycopg2

env = dotenv.dotenv_values("backend/.env")
db_url = env.get("DATABASE_URL")
account_id = env.get("R2_ACCOUNT_ID")
access_key = env.get("R2_ACCESS_KEY_ID")
secret_key = env.get("R2_SECRET_ACCESS_KEY")
bucket = env.get("R2_BUCKET_NAME", "servolocal")
pub_url = env.get("R2_PUBLIC_URL", "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev").rstrip("/")

print(f"Connecting to Cloudflare R2 bucket: {bucket}")
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name="auto"
)

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

def sanitize_key(name: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_-]", "_", name.lower())
    return clean[:40].strip("_")

def download_and_upload_to_r2(url: str, s3_key: str) -> str:
    if not url or url.startswith(pub_url):
        return url
    
    # If it's a relative local path like /assets/...
    if url.startswith("/assets/"):
        local_path = os.path.join("customer-web/public", url.lstrip("/"))
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                data = f.read()
            s3.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=data,
                ContentType="image/png" if url.endswith(".png") else "image/jpeg"
            )
            r2_url = f"{pub_url}/{s3_key}"
            print(f"  [OK Local] {url} -> {r2_url}")
            return r2_url

    # External web URL
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ServoLocal/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg")
            
        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=data,
            ContentType=content_type
        )
        r2_url = f"{pub_url}/{s3_key}"
        print(f"  [OK Remote] Uploaded {len(data)} bytes -> {r2_url}")
        return r2_url
    except Exception as e:
        print(f"  [WARN] Failed to upload {url}: {e}")
        return url

# 1. Update Product Images Table Gallery
print("\n--- 1. Processing Gallery in product_images ---")
cur.execute("SELECT id, master_item_id, image_url, image_type, caption FROM product_images ORDER BY master_item_id, sort_order;")
gallery_rows = cur.fetchall()
print(f"Found {len(gallery_rows)} gallery images.")

for img_id, master_id, img_url, img_type, caption in gallery_rows:
    if img_url and not img_url.startswith(pub_url):
        suffix = sanitize_key(img_type or "view")
        s3_key = f"products/{master_id}/{suffix}_{img_id}.jpg"
        print(f"Uploading gallery image for master #{master_id} ({img_type})...")
        new_url = download_and_upload_to_r2(img_url, s3_key)
        if new_url != img_url:
            cur.execute("UPDATE product_images SET image_url = %s WHERE id = %s;", (new_url, img_id))

# 2. Update Master Catalog Items
print("\n--- 2. Processing master_catalog_items ---")
cur.execute("SELECT id, name, image_url FROM master_catalog_items ORDER BY id;")
master_rows = cur.fetchall()
print(f"Found {len(master_rows)} master catalog items.")

for m_id, name, img_url in master_rows:
    if img_url and not img_url.startswith(pub_url):
        s3_key = f"products/{m_id}/cover.jpg"
        print(f"Uploading cover for #{m_id}: {name}...")
        new_url = download_and_upload_to_r2(img_url, s3_key)
        if new_url != img_url:
            cur.execute("UPDATE master_catalog_items SET image_url = %s WHERE id = %s;", (new_url, m_id))
            cur.execute("UPDATE shop_inventory SET image_url = %s WHERE master_item_id = %s;", (new_url, m_id))

# 3. Add rich gallery entries for dairy & bread if missing
print("\n--- 3. Ensuring Rich Galleries for Key Categories ---")
rich_additions = [
    (101, [
        ("https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Chilled Glass of Fresh Milk"),
        ("https://images.openfoodfacts.org/images/products/890/126/215/0217/ingredients_en.11.400.jpg", "NUTRITION", "Nutrition & FSSAI Standards"),
    ]),
    (104, [
        ("https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Golden Creamy Butter Spread"),
        ("https://images.openfoodfacts.org/images/products/890/126/201/0023/ingredients_en.8.400.jpg", "NUTRITION", "Nutritional Value"),
    ]),
    (108, [
        ("https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Fresh Baked Wheat Loaf Slices"),
    ]),
    (214, [
        ("https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Steaming Hot Masala Noodles"),
        ("https://images.openfoodfacts.org/images/products/890/105/885/2144/ingredients_en.10.400.jpg", "NUTRITION", "Spices & Nutrition Information"),
    ]),
    (215, [
        ("https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Soft Puffed Golden Rotis"),
    ]),
    (217, [
        ("https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80", "AMBIENT", "Hygienic Hand Wash Protection"),
    ]),
]

for m_id, extras in rich_additions:
    for idx, (ex_url, ex_type, ex_caption) in enumerate(extras):
        cur.execute("SELECT id FROM product_images WHERE master_item_id = %s AND image_type = %s;", (m_id, ex_type))
        if not cur.fetchone():
            s3_key = f"products/{m_id}/{ex_type.lower()}_{idx+1}.jpg"
            print(f"Adding & uploading rich gallery for #{m_id} ({ex_type})...")
            new_url = download_and_upload_to_r2(ex_url, s3_key)
            cur.execute("""
                INSERT INTO product_images (master_item_id, image_url, image_type, sort_order, caption)
                VALUES (%s, %s, %s, %s, %s);
            """, (m_id, new_url, ex_type, idx + 2, ex_caption))

print("\nAll images synced and uploaded to Cloudflare R2 successfully!")
conn.close()

