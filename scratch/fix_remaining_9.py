import boto3, dotenv, requests, psycopg2

env = dotenv.dotenv_values("backend/.env")
bucket = env.get("R2_BUCKET_NAME", "servolocal")
pub_url = env.get("R2_PUBLIC_URL", "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev").rstrip("/")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=env.get("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=env.get("R2_SECRET_ACCESS_KEY"),
    region_name="auto"
)

conn = psycopg2.connect(env.get("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

FIX_MAP = {
    212: f"{pub_url}/products/104/pack_shot.jpg",
    218: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80",
    403: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    604: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
    703: "https://images.unsplash.com/photo-1508061252445-5350f3ab0a55?w=600&auto=format&fit=crop&q=80",
    851: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
    852: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
    862: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80",
    9003: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
}

for pid, src in FIX_MAP.items():
    if src.startswith(pub_url):
        r2_url = src
    else:
        resp = requests.get(src, timeout=8, headers={"User-Agent": "ServoLocal"})
        s3_key = f"products/{pid}/pack_shot.jpg"
        s3.put_object(Bucket=bucket, Key=s3_key, Body=resp.content, ContentType="image/jpeg")
        r2_url = f"{pub_url}/{s3_key}"
    cur.execute("UPDATE master_catalog_items SET image_url = %s WHERE id = %s;", (r2_url, pid))
    cur.execute("UPDATE shop_inventory SET image_url = %s WHERE master_item_id = %s;", (r2_url, pid))
    print(f"Fixed #{pid} -> {r2_url}")

cur.execute("SELECT count(*) FROM master_catalog_items WHERE image_url LIKE %s;", ("%r2.dev%",))
print(f"Total products now on R2: {cur.fetchone()[0]} / 65")
conn.close()

