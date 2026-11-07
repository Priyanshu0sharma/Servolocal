import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import text
from app.db.database import engine

async def migrate():
    statements = [
        "ALTER TABLE shop_inventory ADD COLUMN IF NOT EXISTS variants JSON DEFAULT '[]'::json;",
        "ALTER TABLE shop_inventory ADD COLUMN IF NOT EXISTS gallery_images JSON DEFAULT '[]'::json;",
        "ALTER TABLE shop_inventory ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE master_catalog_items ADD COLUMN IF NOT EXISTS variants JSON DEFAULT '[]'::json;",
        "ALTER TABLE master_catalog_items ADD COLUMN IF NOT EXISTS gallery_images JSON DEFAULT '[]'::json;",
        "ALTER TABLE master_catalog_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE master_catalog_items ADD COLUMN IF NOT EXISTS discount_percent FLOAT DEFAULT 0.0;",
        "ALTER TABLE master_catalog_items ADD COLUMN IF NOT EXISTS selling_price FLOAT DEFAULT 0.0;",
        "ALTER TABLE shops ADD COLUMN IF NOT EXISTS custom_serviceable_areas JSON DEFAULT '[]'::json;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_permission_granted BOOLEAN DEFAULT FALSE;",
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
                print(f"[MIGRATION OK] {stmt[:40]}...")
            except Exception as e:
                print(f"[MIGRATION FAILED] {stmt[:40]}: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
