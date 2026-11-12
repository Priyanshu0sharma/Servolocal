import boto3
import dotenv
import psycopg2
import requests
import time

env = dotenv.dotenv_values("backend/.env")
db_url = env.get("DATABASE_URL")
account_id = env.get("R2_ACCOUNT_ID")
access_key = env.get("R2_ACCESS_KEY_ID")
secret_key = env.get("R2_SECRET_ACCESS_KEY")
bucket = env.get("R2_BUCKET_NAME", "servolocal")
pub_url = env.get("R2_PUBLIC_URL", "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev").rstrip("/")

print(f"Connecting to Cloudflare R2 bucket '{bucket}'...")
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name="auto"
)

# Robust source images dictionary
IMAGE_SOURCES = {
    # Dairy, Bread & Eggs
    101: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    102: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80",
    103: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
    104: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
    105: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
    106: "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&auto=format&fit=crop&q=80",
    107: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&auto=format&fit=crop&q=80",
    108: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    109: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80",
    110: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80",
    111: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80",

    # Drinks & Juices
    201: "https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg",
    202: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg",
    203: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80",
    204: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
    205: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600&auto=format&fit=crop&q=80",
    301: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg",
    302: "https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg",
    303: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80",
    304: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
    305: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    306: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&auto=format&fit=crop&q=80",

    # Snacks & Chips
    206: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
    207: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=600&auto=format&fit=crop&q=80",
    208: "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=600&auto=format&fit=crop&q=80",
    209: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80",
    210: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    871: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80",

    # Staples & Grocery
    211: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    212: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
    213: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    214: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
    215: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    216: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    401: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
    402: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
    403: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
    404: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80",
    501: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    502: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    503: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
    601: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    602: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    603: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    604: "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80",
    701: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    702: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
    703: "https://images.unsplash.com/photo-1508061252445-5350f3ab0a55?w=600&auto=format&fit=crop&q=80",

    # Produce
    801: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
    802: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    803: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    804: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",

    # Cleaning & Personal Care
    217: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80",
    218: "https://images.unsplash.com/photo-1559591937-e10b14b870c5?w=600&auto=format&fit=crop&q=80",
    851: "https://images.unsplash.com/photo-1585670270606-2581fb80eaeb?w=600&auto=format&fit=crop&q=80",
    852: "https://images.unsplash.com/photo-1585670270606-2581fb80eaeb?w=600&auto=format&fit=crop&q=80",
    853: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80",
    861: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    862: "https://images.unsplash.com/photo-1559591937-e10b14b870c5?w=600&auto=format&fit=crop&q=80",
    863: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    864: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80",

    # Marketplace & Food
    9001: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    9002: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    9003: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    9004: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
}

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ServoLocal/1.0"
})

def get_db():
    return psycopg2.connect(db_url)

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT id, name, image_url FROM master_catalog_items ORDER BY id;")
products = cur.fetchall()
conn.close()

print(f"Total products to verify: {len(products)}")
success_count = 0

for pid, name, current_url in products:
    if current_url and current_url.startswith(pub_url):
        print(f"  [OK R2] #{pid} {name}")
        success_count += 1
        continue

    source_url = IMAGE_SOURCES.get(pid, current_url)
    if not source_url or source_url.startswith("/assets/"):
        source_url = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"

    s3_key = f"products/{pid}/pack_shot.jpg"
    try:
        resp = session.get(source_url, timeout=6)
        if resp.status_code == 200:
            content_type = resp.headers.get("content-type", "image/jpeg")
            s3.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=resp.content,
                ContentType=content_type,
                CacheControl="public, max-age=31536000"
            )
            r2_url = f"{pub_url}/{s3_key}"
            
            # Update DB with fresh connection
            c = get_db()
            c.autocommit = True
            cursor = c.cursor()
            cursor.execute("UPDATE master_catalog_items SET image_url = %s WHERE id = %s;", (r2_url, pid))
            cursor.execute("UPDATE shop_inventory SET image_url = %s WHERE master_item_id = %s;", (r2_url, pid))
            c.close()

            print(f"  [UPLOADED] #{pid} {name} -> {r2_url}")
            success_count += 1
        else:
            print(f"  [HTTP {resp.status_code}] #{pid} {name} at {source_url}")
    except Exception as e:
        print(f"  [FAILED] #{pid} {name}: {e}")
    time.sleep(0.1)

print(f"\nFinal tally: {success_count} / {len(products)} products hosted on Cloudflare R2 bucket '{bucket}'!")
