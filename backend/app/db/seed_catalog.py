from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.models import MasterCatalogItem, User

PRODUCTS_DATA: List[Dict[str, Any]] = [
    # ══════════════════════════════════════════════════════════════════════════
    # 1. CHIPS & CRISPS / SNACKS & MUNCHIES (User Screenshots 1, 2, 3)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Bingo Tedhe Medhe Masala Tadka Crisps Pouch",
        "brand": "Bingo",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "70 g",
        "mrp": 20.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "70 g", "unit_count": 1, "mrp": 20.0, "price": 16.0, "discount_pct": 20, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 70 g", "unit_count": 2, "mrp": 40.0, "price": 31.0, "discount_pct": 22, "is_default": False},
            {"id": "var_3", "weight_or_size": "3 x 70 g", "unit_count": 3, "mrp": 60.0, "price": 47.0, "discount_pct": 21, "is_default": False}
        ],
        "search_keywords": "bingo, tedhe medhe, masala tadka, chips, crisps, namkeen, snacks",
        "paired_sub_categories": ["Cold Drinks & Juices", "Dairy, Bread & Eggs"]
    },
    {
        "name": "Lay's West Indies Hot n Sweet Chilli Flavour Potato Chips",
        "brand": "Lay's",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "58 g",
        "mrp": 25.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "58 g", "unit_count": 1, "mrp": 25.0, "price": 25.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 58 g", "unit_count": 2, "mrp": 50.0, "price": 48.0, "discount_pct": 4, "is_default": False},
            {"id": "var_3", "weight_or_size": "115 g (Party Pack)", "unit_count": 1, "mrp": 50.0, "price": 45.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "lays, hot n sweet chilli, west indies, orange lays, potato chips, spicy chips",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Lay's India's Magic Masala Potato Chips",
        "brand": "Lay's",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "mrp": 20.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g", "unit_count": 1, "mrp": 20.0, "price": 18.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 50 g", "unit_count": 2, "mrp": 40.0, "price": 35.0, "discount_pct": 12, "is_default": False},
            {"id": "var_3", "weight_or_size": "115 g (Party Pack)", "unit_count": 1, "mrp": 50.0, "price": 45.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "lays blue, magic masala, indian spices chips, wavy chips",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Lay's American Style Cream & Onion Potato Chips",
        "brand": "Lay's",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "mrp": 20.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g", "unit_count": 1, "mrp": 20.0, "price": 18.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 50 g", "unit_count": 2, "mrp": 40.0, "price": 35.0, "discount_pct": 12, "is_default": False},
            {"id": "var_3", "weight_or_size": "115 g (Party Pack)", "unit_count": 1, "mrp": 50.0, "price": 45.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "lays green, cream and onion, sour cream chips, american style",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Kurkure Masala Munch Crispy Namkeen",
        "brand": "Kurkure",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "75 g",
        "mrp": 20.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "75 g", "unit_count": 1, "mrp": 20.0, "price": 18.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 75 g", "unit_count": 2, "mrp": 40.0, "price": 35.0, "discount_pct": 12, "is_default": False},
            {"id": "var_3", "weight_or_size": "150 g (Family Pack)", "unit_count": 1, "mrp": 40.0, "price": 36.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "kurkure, masala munch, spicy namkeen, chatpata kurkure",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Uncle Chipps Spicy Treat Potato Chips",
        "brand": "Uncle Chipps",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "mrp": 20.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g", "unit_count": 1, "mrp": 20.0, "price": 19.0, "discount_pct": 5, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 50 g", "unit_count": 2, "mrp": 40.0, "price": 36.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "uncle chips, spicy treat, desi chips, classic uncle chipps",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Doritos Cheese Supreme Nachos",
        "brand": "Doritos",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "60 g",
        "mrp": 30.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "60 g", "unit_count": 1, "mrp": 30.0, "price": 28.0, "discount_pct": 7, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 60 g", "unit_count": 2, "mrp": 60.0, "price": 54.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "doritos, nachos, corn chips, cheese supreme, tortilla chips",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Haldiram's Nagpur Aloo Bhujia Namkeen",
        "brand": "Haldiram's",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "200 g",
        "mrp": 55.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "200 g", "unit_count": 1, "mrp": 55.0, "price": 50.0, "discount_pct": 9, "is_default": True},
            {"id": "var_2", "weight_or_size": "400 g", "unit_count": 1, "mrp": 105.0, "price": 95.0, "discount_pct": 10, "is_default": False},
            {"id": "var_3", "weight_or_size": "1 kg (Family Pack)", "unit_count": 1, "mrp": 260.0, "price": 230.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "haldiram, aloo bhujia, sev, spicy potato sev, tea time namkeen",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },
    {
        "name": "Haldiram's Khatta Meetha Mixture",
        "brand": "Haldiram's",
        "category": "Kirana",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "200 g",
        "mrp": 55.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "200 g", "unit_count": 1, "mrp": 55.0, "price": 50.0, "discount_pct": 9, "is_default": True},
            {"id": "var_2", "weight_or_size": "400 g", "unit_count": 1, "mrp": 105.0, "price": 95.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "khatta meetha, sweet sour namkeen, haldirams mixture",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 2. COLD DRINKS & JUICES (Blinkit Category 4)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Thums Up Carbonated Soft Drink (750ml)",
        "brand": "Thums Up",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750 ml",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "250 ml (Can)", "unit_count": 1, "mrp": 35.0, "price": 32.0, "discount_pct": 9, "is_default": False},
            {"id": "var_2", "weight_or_size": "750 ml", "unit_count": 1, "mrp": 40.0, "price": 38.0, "discount_pct": 5, "is_default": True},
            {"id": "var_3", "weight_or_size": "2 x 750 ml", "unit_count": 2, "mrp": 80.0, "price": 72.0, "discount_pct": 10, "is_default": False},
            {"id": "var_4", "weight_or_size": "2.25 L (Party Bottle)", "unit_count": 1, "mrp": 95.0, "price": 89.0, "discount_pct": 6, "is_default": False}
        ],
        "search_keywords": "thums up, cold drink, cola, spicy cola, thunder drink",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Coca-Cola Original Soft Drink (750ml)",
        "brand": "Coca-Cola",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750 ml",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "300 ml (Can)", "unit_count": 1, "mrp": 35.0, "price": 32.0, "discount_pct": 9, "is_default": False},
            {"id": "var_2", "weight_or_size": "750 ml", "unit_count": 1, "mrp": 40.0, "price": 38.0, "discount_pct": 5, "is_default": True},
            {"id": "var_3", "weight_or_size": "2 x 750 ml", "unit_count": 2, "mrp": 80.0, "price": 72.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "coke, coca cola, black cold drink, soft drink",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Sprite Lime Flavoured Soft Drink (750ml)",
        "brand": "Sprite",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750 ml",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "750 ml", "unit_count": 1, "mrp": 40.0, "price": 38.0, "discount_pct": 5, "is_default": True},
            {"id": "var_2", "weight_or_size": "2.25 L", "unit_count": 1, "mrp": 95.0, "price": 88.0, "discount_pct": 7, "is_default": False}
        ],
        "search_keywords": "sprite, lime drink, lemon soda, clear cold drink",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Maaza Mango Pulp Drink (600ml)",
        "brand": "Maaza",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "600 ml",
        "mrp": 42.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "600 ml", "unit_count": 1, "mrp": 42.0, "price": 38.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "1.2 L", "unit_count": 1, "mrp": 75.0, "price": 68.0, "discount_pct": 9, "is_default": False}
        ],
        "search_keywords": "maaza, mango juice, aam juice, frooti, real fruit",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Red Bull Energy Drink (250ml)",
        "brand": "Red Bull",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "250 ml",
        "mrp": 125.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "250 ml", "unit_count": 1, "mrp": 125.0, "price": 120.0, "discount_pct": 4, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 250 ml (Duo Pack)", "unit_count": 2, "mrp": 250.0, "price": 235.0, "discount_pct": 6, "is_default": False},
            {"id": "var_3", "weight_or_size": "4 x 250 ml (Pack of 4)", "unit_count": 4, "mrp": 500.0, "price": 460.0, "discount_pct": 8, "is_default": False}
        ],
        "search_keywords": "red bull, energy drink, caffeine drink, stamina can",
        "paired_sub_categories": ["Chips & Crisps"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 3. DAIRY, BREAD & EGGS (Blinkit Category 2)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Amul Taaza Homogenised Toned Milk (500ml)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "500 ml",
        "mrp": 28.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 ml", "unit_count": 1, "mrp": 28.0, "price": 28.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "1 L (Pouch)", "unit_count": 1, "mrp": 56.0, "price": 55.0, "discount_pct": 2, "is_default": False},
            {"id": "var_3", "weight_or_size": "1 L Tetra Pack", "unit_count": 1, "mrp": 75.0, "price": 72.0, "discount_pct": 4, "is_default": False}
        ],
        "search_keywords": "amul taaza, milk, doodh, toned milk, chai milk",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks", "Bakery & Biscuits"]
    },
    {
        "name": "Amul Gold Full Cream Fresh Milk (500ml)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "500 ml",
        "mrp": 34.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 ml", "unit_count": 1, "mrp": 34.0, "price": 34.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "1 L", "unit_count": 1, "mrp": 68.0, "price": 67.0, "discount_pct": 1, "is_default": False}
        ],
        "search_keywords": "amul gold, full cream milk, thick milk, malai doodh",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },
    {
        "name": "Amul Pasteurised Salted Butter (100g)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "100 g",
        "mrp": 58.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "100 g", "unit_count": 1, "mrp": 58.0, "price": 56.0, "discount_pct": 3, "is_default": True},
            {"id": "var_2", "weight_or_size": "500 g", "unit_count": 1, "mrp": 275.0, "price": 265.0, "discount_pct": 4, "is_default": False}
        ],
        "search_keywords": "amul butter, makhan, salted butter, bread butter",
        "paired_sub_categories": ["Bakery & Biscuits"]
    },
    {
        "name": "Harvest Gold White Sandwich Bread (400g)",
        "brand": "Harvest Gold",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "400 g",
        "mrp": 45.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "400 g", "unit_count": 1, "mrp": 45.0, "price": 45.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "700 g (Family Pack)", "unit_count": 1, "mrp": 65.0, "price": 63.0, "discount_pct": 3, "is_default": False}
        ],
        "search_keywords": "bread, harvest gold, sandwich bread, white bread, toast",
        "paired_sub_categories": ["Dairy, Bread & Eggs", "Sauces & Spreads"]
    },
    {
        "name": "Farm Fresh White Eggs (6 Pieces)",
        "brand": "Farm Fresh",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "6 pcs",
        "mrp": 48.0,
        "is_veg": False,
        "image_url": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "6 pcs", "unit_count": 6, "mrp": 48.0, "price": 44.0, "discount_pct": 8, "is_default": True},
            {"id": "var_2", "weight_or_size": "12 pcs (Dozen)", "unit_count": 12, "mrp": 96.0, "price": 84.0, "discount_pct": 12, "is_default": False},
            {"id": "var_3", "weight_or_size": "30 pcs (Tray)", "unit_count": 30, "mrp": 240.0, "price": 205.0, "discount_pct": 15, "is_default": False}
        ],
        "search_keywords": "eggs, andey, fresh eggs, poultry, protein eggs",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },
    {
        "name": "Mother Dairy Malai Paneer (200g)",
        "brand": "Mother Dairy",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "200 g",
        "mrp": 95.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "200 g", "unit_count": 1, "mrp": 95.0, "price": 89.0, "discount_pct": 6, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 200 g", "unit_count": 2, "mrp": 190.0, "price": 174.0, "discount_pct": 8, "is_default": False}
        ],
        "search_keywords": "paneer, cottage cheese, fresh paneer, malai paneer",
        "paired_sub_categories": ["Masala, Oil & More"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 4. BAKERY & BISCUITS (Blinkit Category 8)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Parle-G Original Glucose Biscuits (250g)",
        "brand": "Parle",
        "category": "Kirana",
        "sub_category": "Bakery & Biscuits",
        "default_weight_or_size": "250 g",
        "mrp": 25.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g", "unit_count": 1, "mrp": 5.0, "price": 5.0, "discount_pct": 0, "is_default": False},
            {"id": "var_2", "weight_or_size": "250 g", "unit_count": 1, "mrp": 25.0, "price": 24.0, "discount_pct": 4, "is_default": True},
            {"id": "var_3", "weight_or_size": "800 g (Family Saver)", "unit_count": 1, "mrp": 75.0, "price": 68.0, "discount_pct": 9, "is_default": False}
        ],
        "search_keywords": "parle g, glucose biscuit, chai biscuit, tea time biscuit",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },
    {
        "name": "Cadbury Oreo Vanilla Creme Sandwich Biscuits (120g)",
        "brand": "Oreo",
        "category": "Kirana",
        "sub_category": "Bakery & Biscuits",
        "default_weight_or_size": "120 g",
        "mrp": 35.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "120 g", "unit_count": 1, "mrp": 35.0, "price": 32.0, "discount_pct": 9, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 120 g", "unit_count": 2, "mrp": 70.0, "price": 60.0, "discount_pct": 14, "is_default": False},
            {"id": "var_3", "weight_or_size": "300 g (Family Pack)", "unit_count": 1, "mrp": 85.0, "price": 75.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "oreo, vanilla creme, chocolate cookies, twist lick dunk",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },
    {
        "name": "Parle Hide & Seek Chocolate Chip Cookies (100g)",
        "brand": "Parle",
        "category": "Kirana",
        "sub_category": "Bakery & Biscuits",
        "default_weight_or_size": "100 g",
        "mrp": 35.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "100 g", "unit_count": 1, "mrp": 35.0, "price": 32.0, "discount_pct": 9, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 100 g", "unit_count": 2, "mrp": 70.0, "price": 62.0, "discount_pct": 11, "is_default": False}
        ],
        "search_keywords": "hide seek, chocolate cookies, choco chip, parle cookies",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },
    {
        "name": "Britannia Bourbon Chocolate Cream Biscuits (150g)",
        "brand": "Britannia",
        "category": "Kirana",
        "sub_category": "Bakery & Biscuits",
        "default_weight_or_size": "150 g",
        "mrp": 30.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1548741487-18d16a1a083c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "150 g", "unit_count": 1, "mrp": 30.0, "price": 28.0, "discount_pct": 7, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 150 g", "unit_count": 2, "mrp": 60.0, "price": 54.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "bourbon, chocolate biscuit, sugar sprinkled, cream biscuits",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 5. BREAKFAST & INSTANT FOOD (Blinkit Category 6)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Maggi 2-Minute Masala Instant Noodles (70g)",
        "brand": "Nestle Maggi",
        "category": "Kirana",
        "sub_category": "Breakfast & Instant Food",
        "default_weight_or_size": "70 g",
        "mrp": 14.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "70 g (Single Pack)", "unit_count": 1, "mrp": 14.0, "price": 14.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "4 x 70 g (Pack of 4)", "unit_count": 4, "mrp": 56.0, "price": 52.0, "discount_pct": 7, "is_default": False},
            {"id": "var_3", "weight_or_size": "12 x 70 g (Family Mega Saver)", "unit_count": 12, "mrp": 168.0, "price": 149.0, "discount_pct": 11, "is_default": False}
        ],
        "search_keywords": "maggi, 2 minute noodles, instant noodles, masala noodles, fast food",
        "paired_sub_categories": ["Sauces & Spreads", "Dairy, Bread & Eggs"]
    },
    {
        "name": "Sunfeast YiPPee! Magic Masala Noodles (240g)",
        "brand": "YiPPee!",
        "category": "Kirana",
        "sub_category": "Breakfast & Instant Food",
        "default_weight_or_size": "240 g (Pack of 4)",
        "mrp": 50.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "240 g (Pack of 4)", "unit_count": 1, "mrp": 50.0, "price": 46.0, "discount_pct": 8, "is_default": True},
            {"id": "var_2", "weight_or_size": "480 g (Pack of 8)", "unit_count": 1, "mrp": 96.0, "price": 86.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "yippee, non sticky noodles, magic masala noodles",
        "paired_sub_categories": ["Sauces & Spreads"]
    },
    {
        "name": "Kellogg's Real Almond & Honey Corn Flakes (475g)",
        "brand": "Kellogg's",
        "category": "Kirana",
        "sub_category": "Breakfast & Instant Food",
        "default_weight_or_size": "475 g",
        "mrp": 240.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "475 g", "unit_count": 1, "mrp": 240.0, "price": 215.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "1 kg (Saver Pack)", "unit_count": 1, "mrp": 450.0, "price": 395.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "corn flakes, kelloggs, almond honey, morning breakfast cereal",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 6. SWEET TOOTH & CHOCOLATES (Blinkit Category 7)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Cadbury Dairy Milk Silk Chocolate Bar (150g)",
        "brand": "Cadbury",
        "category": "Kirana",
        "sub_category": "Sweet Tooth",
        "default_weight_or_size": "150 g",
        "mrp": 175.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "60 g", "unit_count": 1, "mrp": 80.0, "price": 75.0, "discount_pct": 6, "is_default": False},
            {"id": "var_2", "weight_or_size": "150 g", "unit_count": 1, "mrp": 175.0, "price": 160.0, "discount_pct": 9, "is_default": True},
            {"id": "var_3", "weight_or_size": "2 x 150 g (Gift Duo)", "unit_count": 2, "mrp": 350.0, "price": 310.0, "discount_pct": 11, "is_default": False}
        ],
        "search_keywords": "cadbury silk, chocolate bar, dairy milk, sweet chocolate",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },
    {
        "name": "Nestle KitKat 4-Finger Chocolate Wafer (38.5g)",
        "brand": "Nestle",
        "category": "Kirana",
        "sub_category": "Sweet Tooth",
        "default_weight_or_size": "38.5 g",
        "mrp": 30.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1620921575116-bdeb872f3e97?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "38.5 g", "unit_count": 1, "mrp": 30.0, "price": 28.0, "discount_pct": 7, "is_default": True},
            {"id": "var_2", "weight_or_size": "3 x 38.5 g", "unit_count": 3, "mrp": 90.0, "price": 79.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "kitkat, chocolate wafer, have a break, nestle",
        "paired_sub_categories": ["Bakery & Biscuits"]
    },
    {
        "name": "Ferrero Rocher Hazelnut Chocolates Box (4 Pieces)",
        "brand": "Ferrero Rocher",
        "category": "Kirana",
        "sub_category": "Sweet Tooth",
        "default_weight_or_size": "50 g (4 pcs)",
        "mrp": 175.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1548741487-18d16a1a083c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g (4 pcs)", "unit_count": 1, "mrp": 175.0, "price": 165.0, "discount_pct": 6, "is_default": True},
            {"id": "var_2", "weight_or_size": "200 g (16 pcs Box)", "unit_count": 1, "mrp": 599.0, "price": 540.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "ferrero rocher, premium chocolates, hazelnut chocolate ball, gift pack",
        "paired_sub_categories": ["Cold Drinks & Juices"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 7. TEA, COFFEE & MILK DRINKS (Blinkit Category 9)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Tata Tea Premium Desh Ki Chai (500g)",
        "brand": "Tata Tea",
        "category": "Kirana",
        "sub_category": "Tea, Coffee & Milk Drinks",
        "default_weight_or_size": "500 g",
        "mrp": 290.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "250 g", "unit_count": 1, "mrp": 150.0, "price": 142.0, "discount_pct": 5, "is_default": False},
            {"id": "var_2", "weight_or_size": "500 g", "unit_count": 1, "mrp": 290.0, "price": 265.0, "discount_pct": 9, "is_default": True},
            {"id": "var_3", "weight_or_size": "1 kg (Super Value)", "unit_count": 1, "mrp": 550.0, "price": 490.0, "discount_pct": 11, "is_default": False}
        ],
        "search_keywords": "tata tea, premium chai patti, desh ki chai, black tea, kadak chai",
        "paired_sub_categories": ["Dairy, Bread & Eggs", "Bakery & Biscuits"]
    },
    {
        "name": "Nescafe Classic 100% Pure Instant Coffee Glass Jar (50g)",
        "brand": "Nescafe",
        "category": "Kirana",
        "sub_category": "Tea, Coffee & Milk Drinks",
        "default_weight_or_size": "50 g",
        "mrp": 190.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "50 g (Jar)", "unit_count": 1, "mrp": 190.0, "price": 175.0, "discount_pct": 8, "is_default": True},
            {"id": "var_2", "weight_or_size": "100 g (Jar)", "unit_count": 1, "mrp": 360.0, "price": 320.0, "discount_pct": 11, "is_default": False}
        ],
        "search_keywords": "nescafe, instant coffee powder, classic coffee, cold coffee",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },
    {
        "name": "Cadbury Bournvita Chocolate Health Drink Pouch (500g)",
        "brand": "Bournvita",
        "category": "Kirana",
        "sub_category": "Tea, Coffee & Milk Drinks",
        "default_weight_or_size": "500 g",
        "mrp": 245.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 g (Pouch)", "unit_count": 1, "mrp": 245.0, "price": 225.0, "discount_pct": 8, "is_default": True},
            {"id": "var_2", "weight_or_size": "1 kg (Jar)", "unit_count": 1, "mrp": 465.0, "price": 419.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "bournvita, chocolate drink, milk powder, horlicks, kids health drink",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 8. ATTA, RICE & DAL (Blinkit Category 10)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Aashirvaad Shudh Chakki Whole Wheat Atta (5kg)",
        "brand": "Aashirvaad",
        "category": "Kirana",
        "sub_category": "Atta, Rice & Dal",
        "default_weight_or_size": "5 kg",
        "mrp": 260.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 55.0, "price": 52.0, "discount_pct": 5, "is_default": False},
            {"id": "var_2", "weight_or_size": "5 kg", "unit_count": 1, "mrp": 260.0, "price": 240.0, "discount_pct": 8, "is_default": True},
            {"id": "var_3", "weight_or_size": "10 kg", "unit_count": 1, "mrp": 495.0, "price": 449.0, "discount_pct": 9, "is_default": False}
        ],
        "search_keywords": "aashirvaad atta, chakki fresh atta, gehu ka aata, whole wheat flour",
        "paired_sub_categories": ["Masala, Oil & More"]
    },
    {
        "name": "Daawat Rozana Super Basmati Rice (1kg)",
        "brand": "Daawat",
        "category": "Kirana",
        "sub_category": "Atta, Rice & Dal",
        "default_weight_or_size": "1 kg",
        "mrp": 115.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 115.0, "price": 99.0, "discount_pct": 14, "is_default": True},
            {"id": "var_2", "weight_or_size": "5 kg", "unit_count": 1, "mrp": 499.0, "price": 435.0, "discount_pct": 13, "is_default": False}
        ],
        "search_keywords": "daawat, basmati rice, chawal, rozana rice, biryani rice",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },
    {
        "name": "Tata Sampann Unpolished Toor Dal (1kg)",
        "brand": "Tata Sampann",
        "category": "Kirana",
        "sub_category": "Atta, Rice & Dal",
        "default_weight_or_size": "1 kg",
        "mrp": 195.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1585994192700-eb6076413701?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 g", "unit_count": 1, "mrp": 105.0, "price": 95.0, "discount_pct": 9, "is_default": False},
            {"id": "var_2", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 195.0, "price": 179.0, "discount_pct": 8, "is_default": True}
        ],
        "search_keywords": "toor dal, arhar dal, tata sampann, unpolished pulses",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 9. MASALA, OIL & MORE (Blinkit Category 11)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Fortune Sunlite Refined Sunflower Oil (1L Pouch)",
        "brand": "Fortune",
        "category": "Kirana",
        "sub_category": "Masala, Oil & More",
        "default_weight_or_size": "1 L",
        "mrp": 155.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_1", "weight_or_size": "1 L (Pouch)", "unit_count": 1, "mrp": 155.0, "price": 139.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "5 L (Jar)", "unit_count": 1, "mrp": 780.0, "price": 699.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "fortune sunflower oil, cooking oil, refined oil, tel",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },
    {
        "name": "Tata Salt Vacuum Evaporated Iodised Salt (1kg)",
        "brand": "Tata Salt",
        "category": "Kirana",
        "sub_category": "Masala, Oil & More",
        "default_weight_or_size": "1 kg",
        "mrp": 28.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 28.0, "price": 27.0, "discount_pct": 4, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 1 kg", "unit_count": 2, "mrp": 56.0, "price": 52.0, "discount_pct": 7, "is_default": False}
        ],
        "search_keywords": "tata namak, iodised salt, white salt, cooking salt",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },
    {
        "name": "MDH Deggi Mirch Red Chilli Powder (100g)",
        "brand": "MDH",
        "category": "Kirana",
        "sub_category": "Masala, Oil & More",
        "default_weight_or_size": "100 g",
        "mrp": 98.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "100 g", "unit_count": 1, "mrp": 98.0, "price": 88.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 100 g", "unit_count": 2, "mrp": 196.0, "price": 172.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "mdh, deggi mirch, red chilli powder, lal mirch, kashmiri mirch",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 10. SAUCES & SPREADS (Blinkit Category 12)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Kissan Fresh Tomato Ketchup Easy Squeezo Bottle (950g)",
        "brand": "Kissan",
        "category": "Kirana",
        "sub_category": "Sauces & Spreads",
        "default_weight_or_size": "950 g",
        "mrp": 145.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 g", "unit_count": 1, "mrp": 85.0, "price": 79.0, "discount_pct": 7, "is_default": False},
            {"id": "var_2", "weight_or_size": "950 g (Squeezo)", "unit_count": 1, "mrp": 145.0, "price": 125.0, "discount_pct": 14, "is_default": True}
        ],
        "search_keywords": "kissan ketchup, tomato sauce, squeezo, burger sauce",
        "paired_sub_categories": ["Breakfast & Instant Food", "Dairy, Bread & Eggs"]
    },
    {
        "name": "Nutella Hazelnut Spread with Cocoa (350g)",
        "brand": "Nutella",
        "category": "Kirana",
        "sub_category": "Sauces & Spreads",
        "default_weight_or_size": "350 g",
        "mrp": 380.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "350 g", "unit_count": 1, "mrp": 380.0, "price": 349.0, "discount_pct": 8, "is_default": True},
            {"id": "var_2", "weight_or_size": "750 g (Family Jar)", "unit_count": 1, "mrp": 750.0, "price": 680.0, "discount_pct": 9, "is_default": False}
        ],
        "search_keywords": "nutella, chocolate spread, hazelnut spread, toast spread",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 11. CLEANING & PERSONAL CARE (Blinkit Categories 16 & 18)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Dettol Antiseptic Liquid Disinfectant (550ml)",
        "brand": "Dettol",
        "category": "Kirana",
        "sub_category": "Cleaning Essentials",
        "default_weight_or_size": "550 ml",
        "mrp": 210.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "250 ml", "unit_count": 1, "mrp": 110.0, "price": 105.0, "discount_pct": 5, "is_default": False},
            {"id": "var_2", "weight_or_size": "550 ml", "unit_count": 1, "mrp": 210.0, "price": 195.0, "discount_pct": 7, "is_default": True},
            {"id": "var_3", "weight_or_size": "1 L (Value Refill)", "unit_count": 1, "mrp": 360.0, "price": 329.0, "discount_pct": 9, "is_default": False}
        ],
        "search_keywords": "dettol liquid, antiseptic, first aid, disinfectant, wound cleaning",
        "paired_sub_categories": ["Personal Care"]
    },
    {
        "name": "Colgate MaxFresh Peppermint Ice Toothpaste (150g)",
        "brand": "Colgate",
        "category": "Kirana",
        "sub_category": "Personal Care",
        "default_weight_or_size": "150 g",
        "mrp": 120.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "150 g", "unit_count": 1, "mrp": 120.0, "price": 108.0, "discount_pct": 10, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 150 g (Saver Saver)", "unit_count": 2, "mrp": 240.0, "price": 199.0, "discount_pct": 17, "is_default": False}
        ],
        "search_keywords": "colgate, maxfresh, blue gel toothpaste, fresh breath, brush",
        "paired_sub_categories": ["Personal Care"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 12. PAN-INDIA COURIER PRODUCTS (Clothes & Custom 3D)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Oversized Streetwear Acid Wash Graphic T-Shirt",
        "brand": "ServoStreet",
        "category": "Clothes",
        "sub_category": "Apparel",
        "default_weight_or_size": "Free Size (M/L/XL)",
        "mrp": 899.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_m", "weight_or_size": "Size M (Chest 40)", "unit_count": 1, "mrp": 899.0, "price": 499.0, "discount_pct": 44, "is_default": True},
            {"id": "var_l", "weight_or_size": "Size L (Chest 42)", "unit_count": 1, "mrp": 899.0, "price": 499.0, "discount_pct": 44, "is_default": False},
            {"id": "var_xl", "weight_or_size": "Size XL (Chest 44)", "unit_count": 1, "mrp": 999.0, "price": 549.0, "discount_pct": 45, "is_default": False}
        ],
        "search_keywords": "oversized t shirt, streetwear, drop shoulder, acid wash, black tshirt",
        "paired_sub_categories": ["Custom/3D"]
    },
    {
        "name": "Custom 3D Lithophane Photo Night Lamp with Wooden Base",
        "brand": "Servo3D",
        "category": "Custom/3D",
        "sub_category": "3D Designs",
        "default_weight_or_size": "1 pc (15cm)",
        "mrp": 1299.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80"
        ],
        "variants": [
            {"id": "var_std", "weight_or_size": "10cm Mini Cube", "unit_count": 1, "mrp": 799.0, "price": 599.0, "discount_pct": 25, "is_default": False},
            {"id": "var_lg", "weight_or_size": "15cm Curved Cylinder", "unit_count": 1, "mrp": 1299.0, "price": 899.0, "discount_pct": 31, "is_default": True},
            {"id": "var_xl", "weight_or_size": "20cm Moon Lamp RGB", "unit_count": 1, "mrp": 1899.0, "price": 1399.0, "discount_pct": 26, "is_default": False}
        ],
        "search_keywords": "3d lithophane lamp, personalized night lamp, custom photo gift, 3d printed gift",
        "paired_sub_categories": ["Clothes"]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 13. ESSENTIAL FMCG HOUSEHOLD & BEVERAGES EXPANSION (50+ BRANDS)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Frooti Fresh Mango Drink Tetra Pack (160ml)",
        "brand": "Frooti",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "160 ml",
        "mrp": 10.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "160 ml", "unit_count": 1, "mrp": 10.0, "price": 10.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "6 x 160 ml (Pack of 6)", "unit_count": 6, "mrp": 60.0, "price": 55.0, "discount_pct": 8, "is_default": False}
        ],
        "search_keywords": "frooti, mango drink, aam ras, tetra pack, kids drink",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Limca Fresh Lime & Lemon Carbonated Drink (750ml)",
        "brand": "Limca",
        "category": "Kirana",
        "sub_category": "Cold Drinks & Juices",
        "default_weight_or_size": "750 ml",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "750 ml", "unit_count": 1, "mrp": 40.0, "price": 38.0, "discount_pct": 5, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 750 ml", "unit_count": 2, "mrp": 80.0, "price": 72.0, "discount_pct": 10, "is_default": False}
        ],
        "search_keywords": "limca, lime lemon soda, fresh fizz, cold drink",
        "paired_sub_categories": ["Chips & Crisps"]
    },
    {
        "name": "Amul Masti Spiced Buttermilk / Masala Chaas (200ml)",
        "brand": "Amul",
        "category": "Kirana",
        "sub_category": "Dairy, Bread & Eggs",
        "default_weight_or_size": "200 ml",
        "mrp": 15.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "200 ml (Pouch)", "unit_count": 1, "mrp": 15.0, "price": 15.0, "discount_pct": 0, "is_default": True},
            {"id": "var_2", "weight_or_size": "500 ml (Bottle)", "unit_count": 1, "mrp": 30.0, "price": 29.0, "discount_pct": 3, "is_default": False}
        ],
        "search_keywords": "amul masti, chaas, buttermilk, spiced lassi, mattha",
        "paired_sub_categories": ["Breakfast & Instant Food"]
    },
    {
        "name": "Sunfeast Dark Fantasy Choco Fills Cookies (75g)",
        "brand": "Sunfeast",
        "category": "Kirana",
        "sub_category": "Bakery & Biscuits",
        "default_weight_or_size": "75 g",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "75 g", "unit_count": 1, "mrp": 40.0, "price": 35.0, "discount_pct": 12, "is_default": True},
            {"id": "var_2", "weight_or_size": "300 g (Family Pack)", "unit_count": 1, "mrp": 150.0, "price": 129.0, "discount_pct": 14, "is_default": False}
        ],
        "search_keywords": "dark fantasy, choco fills, molten chocolate cookies, sunfeast",
        "paired_sub_categories": ["Tea, Coffee & Milk Drinks"]
    },
    {
        "name": "Tata Sampann High Protein Chana Dal (1kg)",
        "brand": "Tata Sampann",
        "category": "Kirana",
        "sub_category": "Atta, Rice & Dal",
        "default_weight_or_size": "1 kg",
        "mrp": 135.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1585994192700-eb6076413701?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "500 g", "unit_count": 1, "mrp": 70.0, "price": 65.0, "discount_pct": 7, "is_default": False},
            {"id": "var_2", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 135.0, "price": 122.0, "discount_pct": 10, "is_default": True}
        ],
        "search_keywords": "chana dal, bengal gram, tata sampann, unpolished dal",
        "paired_sub_categories": ["Masala, Oil & More"]
    },
    {
        "name": "Catch Super Garam Masala Powder (100g)",
        "brand": "Catch",
        "category": "Kirana",
        "sub_category": "Masala, Oil & More",
        "default_weight_or_size": "100 g",
        "mrp": 85.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "100 g", "unit_count": 1, "mrp": 85.0, "price": 76.0, "discount_pct": 11, "is_default": True},
            {"id": "var_2", "weight_or_size": "2 x 100 g", "unit_count": 2, "mrp": 170.0, "price": 148.0, "discount_pct": 13, "is_default": False}
        ],
        "search_keywords": "garam masala, catch spices, indian curry powder, sabzi masala",
        "paired_sub_categories": ["Atta, Rice & Dal"]
    },
    {
        "name": "Veeba Eggless Mayonnaise Chef Special (250g)",
        "brand": "Veeba",
        "category": "Kirana",
        "sub_category": "Sauces & Spreads",
        "default_weight_or_size": "250 g",
        "mrp": 89.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "250 g", "unit_count": 1, "mrp": 89.0, "price": 79.0, "discount_pct": 11, "is_default": True},
            {"id": "var_2", "weight_or_size": "875 g (Value Squeezo)", "unit_count": 1, "mrp": 199.0, "price": 175.0, "discount_pct": 12, "is_default": False}
        ],
        "search_keywords": "mayo, eggless mayonnaise, veeba mayo, sandwich spread, burger cream",
        "paired_sub_categories": ["Dairy, Bread & Eggs"]
    },
    {
        "name": "Surf Excel Easy Wash Detergent Powder (1kg)",
        "brand": "Surf Excel",
        "category": "Kirana",
        "sub_category": "Cleaning Essentials",
        "default_weight_or_size": "1 kg",
        "mrp": 145.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "1 kg", "unit_count": 1, "mrp": 145.0, "price": 135.0, "discount_pct": 7, "is_default": True},
            {"id": "var_2", "weight_or_size": "3 kg (Saver Bag)", "unit_count": 1, "mrp": 425.0, "price": 389.0, "discount_pct": 8, "is_default": False}
        ],
        "search_keywords": "surf excel, detergent powder, washing powder, kapde dhone ka powder",
        "paired_sub_categories": ["Personal Care"]
    },
    {
        "name": "Lifebuoy Total 10 Germ Protection Soap (125g)",
        "brand": "Lifebuoy",
        "category": "Kirana",
        "sub_category": "Personal Care",
        "default_weight_or_size": "125 g",
        "mrp": 40.0,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=600&auto=format&fit=crop&q=80",
        "gallery_images": [],
        "variants": [
            {"id": "var_1", "weight_or_size": "125 g", "unit_count": 1, "mrp": 40.0, "price": 38.0, "discount_pct": 5, "is_default": True},
            {"id": "var_2", "weight_or_size": "4 x 125 g (Buy 3 Get 1 Free)", "unit_count": 4, "mrp": 160.0, "price": 125.0, "discount_pct": 22, "is_default": False}
        ],
        "search_keywords": "lifebuoy soap, bath soap, germ protection, sabun",
        "paired_sub_categories": ["Cleaning Essentials"]
    }
]


async def seed_master_catalog(session: AsyncSession) -> int:
    """
    Intelligently seeds and updates MasterCatalogItem table with rich branded FMCG items,
    packaging photos, multi-pack variants, and dietary (Veg) flags.
    """
    count_added = 0
    count_updated = 0

    for p in PRODUCTS_DATA:
        stmt = select(MasterCatalogItem).where(MasterCatalogItem.name == p["name"])
        existing = (await session.execute(stmt)).scalar_one_or_none()

        if existing:
            # Update missing attributes (variants, gallery, veg flag, keywords)
            existing.brand = p["brand"]
            existing.category = p["category"]
            existing.sub_category = p["sub_category"]
            existing.default_weight_or_size = p["default_weight_or_size"]
            existing.mrp = p["mrp"]
            existing.image_url = p["image_url"]
            existing.gallery_images = p.get("gallery_images", [])
            existing.variants = p.get("variants", [])
            existing.is_veg = p.get("is_veg", True)
            existing.search_keywords = p.get("search_keywords")
            existing.paired_sub_categories = p.get("paired_sub_categories", [])
            count_updated += 1
        else:
            new_item = MasterCatalogItem(
                name=p["name"],
                brand=p["brand"],
                category=p["category"],
                sub_category=p["sub_category"],
                default_weight_or_size=p["default_weight_or_size"],
                mrp=p["mrp"],
                image_url=p["image_url"],
                gallery_images=p.get("gallery_images", []),
                variants=p.get("variants", []),
                is_veg=p.get("is_veg", True),
                search_keywords=p.get("search_keywords"),
                paired_sub_categories=p.get("paired_sub_categories", []),
            )
            session.add(new_item)
            count_added += 1

    await session.commit()
    print(f"[CATALOG SEEDER] Seeded {count_added} new items, updated {count_updated} existing items.")
    return count_added + count_updated


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
