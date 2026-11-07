import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import text
from app.db.database import engine

async def widen():
    async with engine.begin() as conn:
        await conn.execute(text("""
            UPDATE shops SET 
                delivery_radius_km = 45.0,
                custom_serviceable_areas = '[{"area_name": "Jaipur Division", "eta_label": "15-20 mins", "delivery_fee": 15}, {"area_name": "Jaipur", "eta_label": "15-20 mins", "delivery_fee": 15}, {"area_name": "Kukas", "eta_label": "10-15 mins", "delivery_fee": 15}]'::json
            WHERE is_verified = TRUE;
        """))
        print("[DATABASE] Updated all shops radius to 45 KM and added Jaipur Division!")

if __name__ == "__main__":
    asyncio.run(widen())
