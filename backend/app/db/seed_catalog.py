from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.models import MasterCatalogItem, User

PRODUCTS_DATA = [
    # ─── Biscuits & Snacks (Parle, Lay's, Kurkure) ──────────────────────────
    {
        "name": "Parle-G Original Glucose Biscuits (50g)",
        "brand": "Parle",
        "category": "Kirana",
        "sub_category": "Maggi & Biscuits",
        "default_weight_or_size": "50g",
        "mrp": 5.0,
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "parle g, glucose biscuit, chai biscuit, 5 rs parle, tea snacks",
        "paired_sub_categories": ["Dairy & Milk", "Cold Drinks & Juices"]
    },
    {
        "name": "Parle-G Gold Biscuits (100g)",
        "brand": "Parle",
        "category": "Kirana",
        "sub_category": "Maggi & Biscuits",
        "default_weight_or_size": "100g",
        "mrp": 15.0,
        "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "parle gold, richer glucose, gold biscuits, 100g parle",
        "paired_sub_categories": ["Dairy & Milk"]
    },
    {
        "name": "Parle Hide & Seek Chocolate Chip (100g)",
        "brand": "Parle",
        "category": "Kirana",
        "sub_category": "Maggi & Biscuits",
        "default_weight_or_size": "100g",
        "mrp": 35.0,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "hide seek, chocolate biscuit, choco chip cookies, parle cookies",
        "paired_sub_categories": ["Dairy & Milk", "Cold Drinks & Juices"]
    },
    {
        "name": "Kurkure Masala Munch (75g)",
        "brand": "Kurkure",
        "category": "Kirana",
        "sub_category": "Chips & Snacks",
        "default_weight_or_size": "75g",
        "mrp": 20.0,
        "image_url": "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "kurkure, masala munch, spicy namkeen, chatpata snack",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Lay's India's Magic Masala (50g)",
        "brand": "Lay's",
        "category": "Kirana",
        "sub_category": "Chips & Snacks",
        "default_weight_or_size": "50g",
        "mrp": 20.0,
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "lays blue, magic masala chips, potato chips, wavy lays",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Haldiram's Nagpur Aloo Bhujia (200g)",
        "brand": "Haldiram's",
        "category": "Kirana",
        "sub_category": "Chips & Snacks",
        "default_weight_or_size": "200g",
        "mrp": 55.0,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "aloo bhujia, haldiram namkeen, sev, tea snacks",
        "paired_sub_categories": ["Dairy & Milk"]
    },

    # ─── Instant Noodles (Maggi) ───────────────────────────────────────────
    {
        "name": "Maggi 2-Minute Masala Noodles (70g)",
        "brand": "Nestle Maggi",
        "category": "Kirana",
        "sub_category": "Maggi & Biscuits",
        "default_weight_or_size": "70g",
        "mrp": 14.0,
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "maggi, 2 minute noodles, masala noodles, single pack maggi",
        "paired_sub_categories": ["Dairy & Milk", "Cold Drinks & Juices"]
    },
    {
        "name": "Maggi Masala Family Pack (280g)",
        "brand": "Nestle Maggi",
        "category": "Kirana",
        "sub_category": "Maggi & Biscuits",
        "default_weight_or_size": "280g",
        "mrp": 56.0,
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "maggi 4 pack, family pack, big maggi, 280g masala noodles",
        "paired_sub_categories": ["Dairy & Milk"]
    },

    # ─── Dairy & Staples (Amul, Aashirvaad, Tata, Fortune) ──────────────────
    {
        "name": "Amul Taaza Toned Milk (500ml)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy & Milk",
        "default_weight_or_size": "500ml",
        "mrp": 27.0,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "amul taaza, blue amul milk, toned milk pouch, fresh milk 500ml",
        "paired_sub_categories": ["Maggi & Biscuits", "Mithai"]
    },
    {
        "name": "Amul Gold Full Cream Milk (500ml)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy & Milk",
        "default_weight_or_size": "500ml",
        "mrp": 33.0,
        "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "amul gold, red amul milk, full cream milk pouch, thick milk",
        "paired_sub_categories": ["Maggi & Biscuits"]
    },
    {
        "name": "Amul Butter (100g)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy & Milk",
        "default_weight_or_size": "100g",
        "mrp": 58.0,
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "amul butter, salted butter, table butter, pav bhaji butter",
        "paired_sub_categories": ["Hot Fast Food"]
    },
    {
        "name": "Aashirvaad Shudh Chakki Atta (5kg)",
        "brand": "Aashirvaad",
        "category": "Kirana",
        "sub_category": "Atta, Dal & Oil",
        "default_weight_or_size": "5kg",
        "mrp": 235.0,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "aashirvaad atta, whole wheat flour, 5kg gehu atta, chakki fresh",
        "paired_sub_categories": ["Atta, Dal & Oil"]
    },
    {
        "name": "Tata Salt Vacuum Evaporated (1kg)",
        "brand": "Tata",
        "category": "Kirana",
        "sub_category": "Atta, Dal & Oil",
        "default_weight_or_size": "1kg",
        "mrp": 28.0,
        "image_url": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "tata salt, iodized salt, desh ka namak, 1kg white salt",
        "paired_sub_categories": ["Atta, Dal & Oil"]
    },
    {
        "name": "Fortune Sunlite Refined Sunflower Oil (1L)",
        "brand": "Fortune",
        "category": "Kirana",
        "sub_category": "Atta, Dal & Oil",
        "default_weight_or_size": "1L",
        "mrp": 145.0,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "fortune sunflower oil, refined cooking oil, 1 litre tel, light oil",
        "paired_sub_categories": ["Atta, Dal & Oil"]
    },

    # ─── Beverages ──────────────────────────────────────────────────────────
    {
        "name": "Coca-Cola Original (750ml)",
        "brand": "Coca-Cola",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750ml",
        "mrp": 40.0,
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "coca cola, coke 750ml, chilled soft drink, cold beverage",
        "paired_sub_categories": ["Hot Fast Food", "Chips & Snacks"]
    },
    {
        "name": "Thums Up Charged (750ml)",
        "brand": "Thums Up",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750ml",
        "mrp": 40.0,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "thums up, toofani cold drink, strong cola 750ml",
        "paired_sub_categories": ["Hot Fast Food"]
    },

    # ─── Hot Fast Food & Cafe Items ─────────────────────────────────────────
    {
        "name": "Crispy Veg Burger",
        "brand": "ServoKitchen",
        "category": "Fast Food",
        "sub_category": "Hot Fast Food",
        "default_weight_or_size": "1 pc",
        "mrp": 79.0,
        "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "veg burger, crispy aloo tikki burger, cafe burger, fast food",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Cold Coffee with Ice Cream (300ml)",
        "brand": "ServoCafe",
        "category": "Fast Food",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "300ml",
        "mrp": 89.0,
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "cold coffee, thick shake, chocolate coffee, ice cream float",
        "paired_sub_categories": ["Hot Fast Food"]
    },
    {
        "name": "Special Paneer Pyaz Ki Kachori (2 Pcs)",
        "brand": "Local Stall Special",
        "category": "Fast Food",
        "sub_category": "Hot Fast Food",
        "default_weight_or_size": "2 pcs",
        "mrp": 50.0,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "pyaz kachori, jaipuri kachori, crispy street snack, chutney",
        "paired_sub_categories": ["Dairy & Milk"]
    },

    # ─── Traditional Sweets (Mithai) ────────────────────────────────────────
    {
        "name": "Kaju Katli Mithai (500g)",
        "brand": "Royal Sweets",
        "category": "Sweets",
        "sub_category": "Mithai",
        "default_weight_or_size": "500g",
        "mrp": 480.0,
        "image_url": "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "kaju katli, cashew sweet, vark kaju barfi, diwali gift box",
        "paired_sub_categories": ["Chips & Snacks"]
    },
    {
        "name": "Gulab Jamun Desi Ghee (4 Pcs)",
        "brand": "Royal Sweets",
        "category": "Sweets",
        "sub_category": "Mithai",
        "default_weight_or_size": "4 pcs",
        "mrp": 80.0,
        "image_url": "https://images.unsplash.com/photo-1605197154344-979de7df5905?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1605197154344-979de7df5905?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "hot gulab jamun, desi ghee sweet, soft mawa jamun",
        "paired_sub_categories": ["Hot Fast Food"]
    },

    # ─── Pan-India Courier Eligible (Clothes & Custom 3D) ───────────────────
    {
        "name": "Custom Printed Cotton T-Shirt (Pan-India)",
        "brand": "ServoWear",
        "category": "Clothes",
        "sub_category": "Apparel",
        "default_weight_or_size": "1 pc (L)",
        "mrp": 499.0,
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "custom t-shirt, 100% cotton tee, pan-india shipping, anime tee, print t-shirt",
        "paired_sub_categories": ["3D Designs"]
    },
    {
        "name": "Custom 3D Printed Lithophane Lamp (Pan-India)",
        "brand": "Servo3D Labs",
        "category": "Custom/3D",
        "sub_category": "3D Designs",
        "default_weight_or_size": "1 pc",
        "mrp": 799.0,
        "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80"
        ],
        "search_keywords": "3d printed lamp, lithophane photo gift, personalized night lamp, custom 3d",
        "paired_sub_categories": ["Apparel"]
    },
]


async def seed_master_catalog(session: AsyncSession) -> int:
    """
    Checks if MasterCatalogItem table is empty. If so, pre-seeds 20+ distinct brand items.
    Returns the count of seeded items.
    """
    count_stmt = select(func.count()).select_from(MasterCatalogItem)
    result = await session.execute(count_stmt)
    current_count = result.scalar() or 0

    if current_count > 0:
        return current_count

    items_to_add = [
        MasterCatalogItem(
            name=p["name"],
            brand=p["brand"],
            category=p["category"],
            sub_category=p["sub_category"],
            default_weight_or_size=p["default_weight_or_size"],
            mrp=p["mrp"],
            image_url=p["image_url"],
            gallery_images=p["gallery_images"],
            search_keywords=p.get("search_keywords"),
            paired_sub_categories=p.get("paired_sub_categories", []),
        )
        for p in PRODUCTS_DATA
    ]

    session.add_all(items_to_add)
    await session.commit()
    print(f"[CATALOG SEEDER] Successfully populated {len(items_to_add)} Master Catalog items.")
    return len(items_to_add)


async def seed_initial_admin(session: AsyncSession) -> User:
    """Ensures a default super admin user exists in the database."""
    admin_stmt = select(User).where(User.email == "admin@servolocal.in")
    admin = (await session.execute(admin_stmt)).scalar_one_or_none()
    if not admin:
        admin = User(
            email="admin@servolocal.in",
            name="ServoLocal Super Admin",
            role="admin",
            is_active=True,
            terms_accepted=True,
            location_permission_granted=True,
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        print("[ADMIN SEEDER] Created initial super admin: admin@servolocal.in")
    return admin

