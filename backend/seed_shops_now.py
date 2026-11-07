import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import select, func
from app.db.database import AsyncSessionLocal
from app.db.models import User, Shop, ShopInventory, MasterCatalogItem

async def seed_shops():
    async with AsyncSessionLocal() as session:
        # 1. Check if shops exist
        shop_count = (await session.execute(select(func.count(Shop.id)))).scalar()
        print(f"[CURRENT SHOPS COUNT] {shop_count}")

        if shop_count == 0:
            # Create a seller user
            seller_user = (await session.execute(select(User).where(User.email == "seller.kukas@servolocal.in"))).scalar_one_or_none()
            if not seller_user:
                seller_user = User(
                    email="seller.kukas@servolocal.in",
                    name="Ramesh Sharma",
                    role="seller",
                    is_active=True,
                    terms_accepted=True,
                    location_permission_granted=True,
                    upi_id="sharmaji.kirana@oksbi"
                )
                session.add(seller_user)
                await session.commit()
                await session.refresh(seller_user)

            # Create 3 Real Verified Shops in Kukas / Amer
            shop1 = Shop(
                owner_id=seller_user.id,
                name="Sharma Ji Daily Kirana & Dairy",
                category="Kirana",
                image_url="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80",
                is_open=True,
                rating=4.8,
                management_mode="SELLER_MANAGED",
                lat=27.0544,
                lng=75.8942,
                locality_name="Kukas, Jaipur (RIICO / Colleges)",
                delivery_scope="BOTH",
                delivery_radius_km=5.0,
                local_eta_mins="12-15 mins",
                national_eta_days="3-5 Days",
                free_delivery_enabled=True,
                min_order_for_free_delivery=150.0,
                base_delivery_fee=20.0,
                seller_upi_id="sharmaji.kirana@oksbi",
                commission_rate_percent=10.0,
                is_verified=True,
            )

            shop2 = Shop(
                owner_id=seller_user.id,
                name="Jaipur Fast Food & Chai Tapri",
                category="Fast Food",
                image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
                is_open=True,
                rating=4.9,
                management_mode="PARTNER_RUNNER_STALL",
                lat=27.0560,
                lng=75.8950,
                locality_name="Kukas Highway Hub",
                delivery_scope="LOCAL_ONLY",
                delivery_radius_km=4.0,
                local_eta_mins="15-20 mins",
                national_eta_days="3-5 Days",
                free_delivery_enabled=True,
                min_order_for_free_delivery=120.0,
                base_delivery_fee=15.0,
                seller_upi_id="jaipurfastfood@paytm",
                commission_rate_percent=10.0,
                is_verified=True,
            )

            shop3 = Shop(
                owner_id=seller_user.id,
                name="Rawat Sweets & Namkeen Bhandar",
                category="Sweets",
                image_url="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
                is_open=True,
                rating=4.7,
                management_mode="SELLER_MANAGED",
                lat=27.0520,
                lng=75.8920,
                locality_name="Amer Fort Road Hub",
                delivery_scope="BOTH",
                delivery_radius_km=7.0,
                local_eta_mins="20-25 mins",
                national_eta_days="3-5 Days",
                free_delivery_enabled=True,
                min_order_for_free_delivery=200.0,
                base_delivery_fee=25.0,
                seller_upi_id="rawatsweets@okaxis",
                commission_rate_percent=10.0,
                is_verified=True,
            )

            session.add_all([shop1, shop2, shop3])
            await session.commit()
            await session.refresh(shop1)
            await session.refresh(shop2)
            await session.refresh(shop3)
            print(f"[SEEDED SHOPS] IDs: {shop1.id}, {shop2.id}, {shop3.id}")

            # Fetch Master Catalog Items to populate shop inventory
            master_items = (await session.execute(select(MasterCatalogItem))).scalars().all()
            print(f"[MASTER CATALOG AVAILABLE] {len(master_items)} items")

            inventory_records = []
            for item in master_items:
                # Assign kirana / chips / drinks to Shop 1 (Sharma Ji)
                selling_price = round(item.mrp * 0.9, 1) if item.mrp > 10 else item.mrp
                
                inv = ShopInventory(
                    shop_id=shop1.id if item.category in ["Kirana", "Dairy, Bread & Eggs", "Cold Drinks & Juices"] else (shop2.id if item.category == "Fast Food" else shop3.id),
                    master_item_id=item.id,
                    is_not_listed_custom=False,
                    name=item.name,
                    category=item.category,
                    sub_category=item.sub_category,
                    image_url=item.image_url,
                    gallery_images=item.gallery_images or [],
                    variants=item.variants or [],
                    is_veg=item.is_veg,
                    weight_or_size=item.default_weight_or_size or "1 Unit",
                    selling_price=selling_price,
                    mrp=item.mrp,
                    total_stock=50,
                    sold_count=0,
                    available_stock=48,
                    low_stock_threshold=5,
                    in_stock=True,
                    is_pan_india_eligible=True if item.category in ["Kirana", "Sweets"] else False
                )
                inventory_records.append(inv)

            session.add_all(inventory_records)
            await session.commit()
            print(f"[SEEDED INVENTORY] Added {len(inventory_records)} real inventory items linked to verified shops!")

if __name__ == "__main__":
    asyncio.run(seed_shops())

