import boto3
import dotenv
import psycopg2
import urllib.request
import re

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

# Curated authentic product pack photography for all master products
PRODUCT_IMAGE_MAP = {
    # Dairy, Bread & Eggs
    101: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", # Amul Taaza Milk
    102: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80", # Amul Gold Milk
    103: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80", # Saras Dahi Tub
    104: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80", # Amul Butter
    105: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80", # Amul Butter Tub
    106: "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&auto=format&fit=crop&q=80", # Cheese Slices
    107: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&auto=format&fit=crop&q=80", # Paneer Block
    108: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", # Britannia Wheat Bread
    109: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80", # Harvest Gold Bread
    110: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80", # Eggs 6 Tray
    111: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80", # Eggs 30 Pack

    # Soft Drinks & Cold Drinks
    201: "https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg", # Thums Up
    202: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg", # Coca-Cola
    203: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80", # Sprite
    204: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80", # Pepsi
    205: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600&auto=format&fit=crop&q=80", # Appy Fizz
    301: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg", # Coca Cola Chilled
    302: "https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg", # Thums Up Charged
    303: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80", # Sprite Can
    304: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80", # Red Bull Can
    305: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80", # Real Juice
    306: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&auto=format&fit=crop&q=80", # Bisleri Water

    # Chips & Namkeen
    206: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80", # Lay's Classic Salted
    207: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=600&auto=format&fit=crop&q=80", # Lay's Magic Masala
    208: "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=600&auto=format&fit=crop&q=80", # Lay's Cream & Onion
    209: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80", # Kurkure Masala Munch
    210: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", # Haldiram's Bhujia
    871: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80", # Orbit Chewing Gum

    # Staples, Atta, Rice & Oil
    211: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", # Amul Taaza
    212: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80", # Butter
    213: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", # Bread
    214: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", # Maggi 4-pack
    215: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", # Aashirvaad Atta
    216: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80", # Tata Salt
    401: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", # Maggi Noodles
    402: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", # Maggi Special
    403: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80", # McCain French Fries
    404: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80", # Knorr Tomato Soup
    501: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", # Tata Tea Gold
    502: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", # Nescafe Coffee
    503: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80", # Bournvita
    601: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", # Aashirvaad Chakki Atta
    602: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", # Fortune Mustard Oil
    603: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80", # Daawat Basmati Rice
    604: "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80", # Toor Dal
    701: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80", # Tata Salt
    702: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80", # MDH Deggi Mirch
    703: "https://images.unsplash.com/photo-1508061252445-5350f3ab0a55?w=600&auto=format&fit=crop&q=80", # Almonds Badam

    # Fresh Produce
    801: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80", # Tomatoes
    802: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80", # Potatoes
    803: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80", # Onions
    804: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80", # Bananas

    # Cleaning & Personal Care
    217: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80", # Dettol Refill
    218: "https://images.unsplash.com/photo-1559591937-e10b14b870c5?w=600&auto=format&fit=crop&q=80", # Colgate Toothpaste
    851: "https://images.unsplash.com/photo-1585670270606-2581fb80eaeb?w=600&auto=format&fit=crop&q=80", # Surf Excel Detergent
    852: "https://images.unsplash.com/photo-1585670270606-2581fb80eaeb?w=600&auto=format&fit=crop&q=80", # Vim Gel
    853: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80", # Lizol Cleaner
    861: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", # Dettol Soap
    862: "https://images.unsplash.com/photo-1559591937-e10b14b870c5?w=600&auto=format&fit=crop&q=80", # Colgate Total
    863: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", # Dolo 650
    864: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80", # Vicks VapoRub

    # Legacy demo placeholders updated to high-res real goods
    9001: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80", # Pizza Margherita
    9002: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80", # Fresh Vegetables Basket
    9003: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", # Wireless Headphones
    9004: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80", # Men's Casual Shirt
}

def upload_url_to_r2(url: str, s3_key: str) -> str:
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ServoLocal/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg")

        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000"
        )
        r2_url = f"{pub_url}/{s3_key}"
        return r2_url
    except Exception as e:
        print(f"Error uploading {url} to {s3_key}: {e}")
        return url

# Query all items in master_catalog_items
cur.execute("SELECT id, name, image_url FROM master_catalog_items ORDER BY id;")
items = cur.fetchall()

success_count = 0
for pid, name, current_img in items:
    # If already hosted on R2, skip
    if current_img and current_img.startswith(pub_url):
        print(f"#{pid} {name} is already on Cloudflare R2: {current_img}")
        success_count += 1
        continue

    target_source = PRODUCT_IMAGE_MAP.get(pid, current_img)
    if not target_source or target_source.startswith("/assets/"):
        target_source = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"

    s3_key = f"products/{pid}/pack_shot.jpg"
    print(f"Uploading #{pid} {name} to R2 -> {s3_key}...")
    r2_url = upload_url_to_r2(target_source, s3_key)

    if r2_url.startswith(pub_url):
        cur.execute("UPDATE master_catalog_items SET image_url = %s WHERE id = %s;", (r2_url, pid))
        cur.execute("UPDATE shop_inventory SET image_url = %s WHERE master_item_id = %s;", (r2_url, pid))
        success_count += 1
        print(f"  [SUCCESS] #{pid} updated to {r2_url}")

print(f"\nCompleted! {success_count} / {len(items)} products are now hosted on Cloudflare R2!")

# Ensure Thums Up has full multi-photo gallery in R2
thums_up_gallery = [
    ("products/201/pack_shot.jpg", "FRONT", "Thums Up 750ml Bottle Front"),
    ("products/201/ambient_2.jpg", "AMBIENT", "Chilled Serving with Ice"),
    ("products/201/pack_4.jpg", "PACK", "Twin Pack Offer View"),
]
for sort_idx, (key, g_type, caption) in enumerate(thums_up_gallery):
    g_url = f"{pub_url}/{key}"
    cur.execute("SELECT id FROM product_images WHERE master_item_id = 201 AND image_type = %s;", (g_type,))
    existing = cur.fetchone()
    if existing:
        cur.execute("UPDATE product_images SET image_url = %s, caption = %s WHERE id = %s;", (g_url, caption, existing[0]))
    else:
        cur.execute("""
            INSERT INTO product_images (master_item_id, image_url, image_type, sort_order, caption)
            VALUES (201, %s, %s, %s, %s);
        """, (g_url, g_type, sort_idx + 1, caption))

conn.close()
