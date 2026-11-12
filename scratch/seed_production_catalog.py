import json
import psycopg2
import dotenv

env = dotenv.dotenv_values("backend/.env")
db_url = env.get("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL is missing in backend/.env")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

PRODUCTS = [
    # ── Soft Drinks & Juices ────────────────────────────────────────────────
    {
        "id": 201,
        "barcode": "8901764012297",
        "name": "Thums Up Cola Soft Drink",
        "brand": "Thums Up",
        "category": "Food & Drinks",
        "sub_category": "Soft Drinks",
        "default_weight_or_size": "750 ml",
        "unit": "750 ml",
        "pack_size": "Bottle",
        "mrp": 40.0,
        "selling_price": 38.0,
        "is_veg": True,
        "description": "Thums Up is known for its strong, fizzy, and spicy cola taste that provides an energetic kick. Best served chilled.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/176/401/2297/front_en.11.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/176/401/2297/front_en.11.400.jpg", "type": "FRONT", "caption": "Thums Up 750ml Front Pack"},
            {"url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Chilled Serving with Ice"},
            {"url": "https://images.openfoodfacts.org/images/products/890/176/401/2297/ingredients_en.7.400.jpg", "type": "NUTRITION", "caption": "Ingredients & Nutrition Facts"},
            {"url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80", "type": "PACK", "caption": "Twin Pack Offer View"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 38.0, "mrp": 40.0, "stock": 50, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 36.0, "mrp": 40.0, "stock": 120, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 40.0, "mrp": 40.0, "stock": 500, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 202,
        "barcode": "8901764022210",
        "name": "Coca-Cola Original Taste Soft Drink",
        "brand": "Coca-Cola",
        "category": "Food & Drinks",
        "sub_category": "Soft Drinks",
        "default_weight_or_size": "750 ml",
        "unit": "750 ml",
        "pack_size": "Bottle",
        "mrp": 40.0,
        "selling_price": 38.0,
        "is_veg": True,
        "description": "Coca-Cola is the world's favourite soft drink that offers a refreshing taste. Perfect accompaniment for meals and parties.",
        "image_url": "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.716.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.716.400.jpg", "type": "FRONT", "caption": "Coca-Cola Bottle Front"},
            {"url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Refreshing Ice Glass"},
            {"url": "https://images.openfoodfacts.org/images/products/544/900/000/0996/ingredients_en.598.400.jpg", "type": "NUTRITION", "caption": "Nutrition Label"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 38.0, "mrp": 40.0, "stock": 60, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 36.0, "mrp": 40.0, "stock": 150, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 40.0, "mrp": 40.0, "stock": 600, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 203,
        "barcode": "8901764032219",
        "name": "Sprite Lime Flavoured Sparkling Drink",
        "brand": "Sprite",
        "category": "Food & Drinks",
        "sub_category": "Soft Drinks",
        "default_weight_or_size": "750 ml",
        "unit": "750 ml",
        "pack_size": "Bottle",
        "mrp": 40.0,
        "selling_price": 39.0,
        "is_veg": True,
        "description": "Crisp, refreshing and clean-tasting lemon-lime soda drink that quenches thirst instantly.",
        "image_url": "https://images.openfoodfacts.org/images/products/544/900/001/1527/front_en.216.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/544/900/001/1527/front_en.216.400.jpg", "type": "FRONT", "caption": "Sprite 750ml Front View"},
            {"url": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Lemon Lime Cold Chill"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 39.0, "mrp": 40.0, "stock": 45, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 37.0, "mrp": 40.0, "stock": 100, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 40.0, "mrp": 40.0, "stock": 400, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 204,
        "barcode": "8902080000018",
        "name": "Pepsi Soft Drink Bottle",
        "brand": "Pepsi",
        "category": "Food & Drinks",
        "sub_category": "Soft Drinks",
        "default_weight_or_size": "750 ml",
        "unit": "750 ml",
        "pack_size": "Bottle",
        "mrp": 40.0,
        "selling_price": 38.0,
        "is_veg": True,
        "description": "Bold, bubbly, and invigorating cola drink that refreshes every celebratory moment.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/208/000/0018/front_en.3.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/208/000/0018/front_en.3.400.jpg", "type": "FRONT", "caption": "Pepsi Front Bottle"},
            {"url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Pepsi Chill Pour"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 38.0, "mrp": 40.0, "stock": 50, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 36.0, "mrp": 40.0, "stock": 80, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 205,
        "barcode": "8902579100016",
        "name": "Appy Fizz Sparkling Apple Drink",
        "brand": "Appy Fizz",
        "category": "Food & Drinks",
        "sub_category": "Soft Drinks",
        "default_weight_or_size": "600 ml",
        "unit": "600 ml",
        "pack_size": "Bottle",
        "mrp": 40.0,
        "selling_price": 38.0,
        "is_veg": True,
        "description": "The Champagne of fruit drinks! Sparkling apple juice with crisp bubbles and pure fruit freshness.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/257/910/0016/front_en.21.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/257/910/0016/front_en.21.400.jpg", "type": "FRONT", "caption": "Appy Fizz Bottle Front"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 38.0, "mrp": 40.0, "stock": 40, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 36.0, "mrp": 40.0, "stock": 90, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },

    # ── Chips & Crisps (Snacks & Munchies) ──────────────────────────────────
    {
        "id": 206,
        "barcode": "8901491101830",
        "name": "Lay's Classic Salted Potato Chips",
        "brand": "Lay's",
        "category": "Grocery",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "unit": "50 g",
        "pack_size": "Pouch",
        "mrp": 20.0,
        "selling_price": 20.0,
        "is_veg": True,
        "description": "Made with the finest quality farm-grown potatoes, sliced wafer-thin and seasoned with pure sea salt.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/149/110/1830/front_en.24.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/149/110/1830/front_en.24.400.jpg", "type": "FRONT", "caption": "Lay's Classic Salted Front"},
            {"url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Golden Crispy Potato Chips"},
            {"url": "https://images.openfoodfacts.org/images/products/890/149/110/1830/ingredients_en.16.400.jpg", "type": "NUTRITION", "caption": "Nutritional Information"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 20.0, "mrp": 20.0, "stock": 100, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 18.0, "mrp": 20.0, "stock": 250, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 20.0, "mrp": 20.0, "stock": 800, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 207,
        "barcode": "8901491101847",
        "name": "Lay's India's Magic Masala Potato Chips",
        "brand": "Lay's",
        "category": "Grocery",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "unit": "50 g",
        "pack_size": "Pouch",
        "mrp": 20.0,
        "selling_price": 20.0,
        "is_veg": True,
        "description": "Infused with spicy Indian seasoning and aromatic herbs. An unbeatable crunchy snacking companion.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/149/110/1847/front_en.23.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/149/110/1847/front_en.23.400.jpg", "type": "FRONT", "caption": "Lay's Magic Masala Pack"},
            {"url": "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Crispy Masala Chips Bowl"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 20.0, "mrp": 20.0, "stock": 120, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 18.0, "mrp": 20.0, "stock": 300, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 20.0, "mrp": 20.0, "stock": 1000, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 208,
        "barcode": "8901491101854",
        "name": "Lay's American Style Cream & Onion Chips",
        "brand": "Lay's",
        "category": "Grocery",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "50 g",
        "unit": "50 g",
        "pack_size": "Pouch",
        "mrp": 20.0,
        "selling_price": 20.0,
        "is_veg": True,
        "description": "Creamy sour cream blended with aromatic spring onions. Delightful mild crunch for anytime snacking.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/149/110/1854/front_en.22.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/149/110/1854/front_en.22.400.jpg", "type": "FRONT", "caption": "Cream & Onion Front"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 20.0, "mrp": 20.0, "stock": 80, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 18.0, "mrp": 20.0, "stock": 200, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 209,
        "barcode": "8901491102011",
        "name": "Kurkure Masala Munch Crisps",
        "brand": "Kurkure",
        "category": "Grocery",
        "sub_category": "Chips & Crisps",
        "default_weight_or_size": "80 g",
        "unit": "80 g",
        "pack_size": "Pouch",
        "mrp": 20.0,
        "selling_price": 20.0,
        "is_veg": True,
        "description": "Tedhe-medhe crunchy corn puffs packed with intense Indian chatpata masala flavor.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/149/110/2011/front_en.16.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/149/110/2011/front_en.16.400.jpg", "type": "FRONT", "caption": "Kurkure Masala Munch"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 20.0, "mrp": 20.0, "stock": 90, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 18.0, "mrp": 20.0, "stock": 250, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 210,
        "barcode": "8904004400024",
        "name": "Haldiram's Nagpur Aloo Bhujia Namkeen",
        "brand": "Haldiram's",
        "category": "Grocery",
        "sub_category": "Namkeen & Snacks",
        "default_weight_or_size": "200 g",
        "unit": "200 g",
        "pack_size": "Pouch",
        "mrp": 55.0,
        "selling_price": 50.0,
        "is_veg": True,
        "description": "Crispy potato noodle snack prepared with mint, spices, and gram flour. Iconic tea-time snack.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/400/440/0024/front_en.29.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/400/440/0024/front_en.29.400.jpg", "type": "FRONT", "caption": "Haldiram's Aloo Bhujia"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 50.0, "mrp": 55.0, "stock": 60, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 3, "selling_price": 48.0, "mrp": 55.0, "stock": 100, "mode": "IN_MINUTES", "eta": "⚡ 15 Mins"},
            {"shop_id": 7, "selling_price": 46.0, "mrp": 55.0, "stock": 300, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },

    # ── Dairy, Bread & Eggs ────────────────────────────────────────────────
    {
        "id": 211,
        "barcode": "8901262150217",
        "name": "Amul Taaza Homogenised Toned Milk",
        "brand": "Amul",
        "category": "Grocery",
        "sub_category": "Dairy & Milk",
        "default_weight_or_size": "1 L",
        "unit": "1 L",
        "pack_size": "Pouch / Carton",
        "mrp": 56.0,
        "selling_price": 56.0,
        "is_veg": True,
        "description": "Fresh pasteurised toned milk with 3.0% milk fat and 8.5% milk SNF. Enriched with vitamins A & D.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/126/215/0217/front_en.35.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/126/215/0217/front_en.35.400.jpg", "type": "FRONT", "caption": "Amul Taaza Front Pouch"},
            {"url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Glass of Fresh Milk"}
        ],
        "offers": [
            {"shop_id": 2, "selling_price": 56.0, "mrp": 56.0, "stock": 100, "mode": "IN_MINUTES", "eta": "⚡ 8-10 Mins"},
            {"shop_id": 1, "selling_price": 56.0, "mrp": 56.0, "stock": 50, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 54.0, "mrp": 56.0, "stock": 200, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 212,
        "barcode": "8901262010023",
        "name": "Amul Pasteurized Salted Table Butter",
        "brand": "Amul",
        "category": "Grocery",
        "sub_category": "Butter & Cheese",
        "default_weight_or_size": "100 g",
        "unit": "100 g",
        "pack_size": "Box",
        "mrp": 60.0,
        "selling_price": 58.0,
        "is_veg": True,
        "description": "Utterly butterly delicious! Made from pure milk fat with natural rich aroma and texture.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/126/201/0023/front_en.11.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/126/201/0023/front_en.11.400.jpg", "type": "FRONT", "caption": "Amul Butter 100g Box"}
        ],
        "offers": [
            {"shop_id": 2, "selling_price": 58.0, "mrp": 60.0, "stock": 60, "mode": "IN_MINUTES", "eta": "⚡ 8-10 Mins"},
            {"shop_id": 1, "selling_price": 58.0, "mrp": 60.0, "stock": 40, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 56.0, "mrp": 60.0, "stock": 180, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 213,
        "barcode": "8901063012015",
        "name": "Britannia 100% Whole Wheat Bread",
        "brand": "Britannia",
        "category": "Grocery",
        "sub_category": "Bread & Bakery",
        "default_weight_or_size": "400 g",
        "unit": "400 g",
        "pack_size": "Loaf",
        "mrp": 50.0,
        "selling_price": 45.0,
        "is_veg": True,
        "description": "Baked with 100% whole wheat flour, rich in dietary fiber with zero added maida.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/106/301/2015/front_en.14.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/106/301/2015/front_en.14.400.jpg", "type": "FRONT", "caption": "Britannia Wheat Bread Pack"}
        ],
        "offers": [
            {"shop_id": 2, "selling_price": 45.0, "mrp": 50.0, "stock": 35, "mode": "IN_MINUTES", "eta": "⚡ 8-10 Mins"},
            {"shop_id": 1, "selling_price": 45.0, "mrp": 50.0, "stock": 25, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"}
        ]
    },

    # ── Instant Food & Staples ───────────────────────────────────────────────
    {
        "id": 214,
        "barcode": "8901058852230",
        "name": "Maggi 2-Minute Instant Masala Noodles (Pack of 4)",
        "brand": "Maggi",
        "category": "Grocery",
        "sub_category": "Instant Noodles",
        "default_weight_or_size": "280 g (4 x 70g)",
        "unit": "280 g",
        "pack_size": "Multi-Pack",
        "mrp": 60.0,
        "selling_price": 54.0,
        "is_veg": True,
        "description": "India's favourite noodles enriched with iron and fortified tastemaker spices. Ready in just 2 minutes.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/105/885/2230/front_en.25.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/105/885/2230/front_en.25.400.jpg", "type": "FRONT", "caption": "Maggi 4-Pack Front"},
            {"url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80", "type": "AMBIENT", "caption": "Hot Steaming Masala Noodles Bowl"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 54.0, "mrp": 60.0, "stock": 80, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 50.0, "mrp": 60.0, "stock": 220, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 54.0, "mrp": 60.0, "stock": 600, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 215,
        "barcode": "8901030000010",
        "name": "Aashirvaad Superior MP Sharbati Atta",
        "brand": "Aashirvaad",
        "category": "Grocery",
        "sub_category": "Atta & Flours",
        "default_weight_or_size": "5 kg",
        "unit": "5 kg",
        "pack_size": "Bag",
        "mrp": 260.0,
        "selling_price": 245.0,
        "is_veg": True,
        "description": "Crafted from golden amber grains sourced from Madhya Pradesh. High water absorption makes rotis extra soft.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/103/000/0010/front_en.18.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/103/000/0010/front_en.18.400.jpg", "type": "FRONT", "caption": "Aashirvaad 5kg Bag"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 245.0, "mrp": 260.0, "stock": 40, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 235.0, "mrp": 260.0, "stock": 150, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },
    {
        "id": 216,
        "barcode": "8901058000015",
        "name": "Tata Salt Vacuum Evaporated Iodized Salt",
        "brand": "Tata Salt",
        "category": "Grocery",
        "sub_category": "Salt, Sugar & Jaggery",
        "default_weight_or_size": "1 kg",
        "unit": "1 kg",
        "pack_size": "Packet",
        "mrp": 28.0,
        "selling_price": 25.0,
        "is_veg": True,
        "description": "Desh Ka Namak! Vacuum evaporated pure iodized salt essential for cognitive health and mental development.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/105/800/0015/front_en.21.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/105/800/0015/front_en.21.400.jpg", "type": "FRONT", "caption": "Tata Salt 1kg Front"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 25.0, "mrp": 28.0, "stock": 90, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 24.0, "mrp": 28.0, "stock": 300, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    },

    # ── Personal Care & Hygiene ─────────────────────────────────────────────
    {
        "id": 217,
        "barcode": "8901396388015",
        "name": "Dettol Original Liquid Handwash Refill",
        "brand": "Dettol",
        "category": "Beauty & Care",
        "sub_category": "Hand & Body Wash",
        "default_weight_or_size": "675 ml",
        "unit": "675 ml",
        "pack_size": "Pouch",
        "mrp": 120.0,
        "selling_price": 98.0,
        "is_veg": True,
        "description": "Protects against 100 illness-causing germs. Specially formulated with pine fragrance and pH-balanced formula.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/139/638/8015/front_en.12.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/139/638/8015/front_en.12.400.jpg", "type": "FRONT", "caption": "Dettol Handwash Pouch Front"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 98.0, "mrp": 120.0, "stock": 50, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 92.0, "mrp": 120.0, "stock": 140, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"},
            {"shop_id": 8, "selling_price": 98.0, "mrp": 120.0, "stock": 400, "mode": "PAN_INDIA", "eta": "🌐 2-4 Days Courier"}
        ]
    },
    {
        "id": 218,
        "barcode": "8901314010012",
        "name": "Colgate Strong Teeth Anticavity Toothpaste",
        "brand": "Colgate",
        "category": "Beauty & Care",
        "sub_category": "Oral Care",
        "default_weight_or_size": "150 g",
        "unit": "150 g",
        "pack_size": "Tube",
        "mrp": 75.0,
        "selling_price": 68.0,
        "is_veg": True,
        "description": "Amino Shakti formula that provides 2X stronger teeth by boosting natural calcium absorption.",
        "image_url": "https://images.openfoodfacts.org/images/products/890/131/401/0012/front_en.15.400.jpg",
        "gallery": [
            {"url": "https://images.openfoodfacts.org/images/products/890/131/401/0012/front_en.15.400.jpg", "type": "FRONT", "caption": "Colgate Strong Teeth Front"}
        ],
        "offers": [
            {"shop_id": 1, "selling_price": 68.0, "mrp": 75.0, "stock": 60, "mode": "IN_MINUTES", "eta": "⚡ 10-15 Mins"},
            {"shop_id": 7, "selling_price": 64.0, "mrp": 75.0, "stock": 180, "mode": "ONE_DAY", "eta": "📅 In 1 Day (Same Day)"}
        ]
    }
]

print(f"Starting seed for {len(PRODUCTS)} authentic products...")

for p in PRODUCTS:
    # 1. Insert or update master_catalog_items
    cur.execute('''
        INSERT INTO master_catalog_items (
            id, barcode, name, brand, category, sub_category, default_weight_or_size,
            unit, pack_size, mrp, selling_price, discount_percent, image_url, is_veg,
            gallery_images, paired_sub_categories, description, status, source_id, license, attribution, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            barcode = EXCLUDED.barcode,
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            category = EXCLUDED.category,
            sub_category = EXCLUDED.sub_category,
            default_weight_or_size = EXCLUDED.default_weight_or_size,
            unit = EXCLUDED.unit,
            pack_size = EXCLUDED.pack_size,
            mrp = EXCLUDED.mrp,
            selling_price = EXCLUDED.selling_price,
            discount_percent = EXCLUDED.discount_percent,
            image_url = EXCLUDED.image_url,
            is_veg = EXCLUDED.is_veg,
            gallery_images = EXCLUDED.gallery_images,
            description = EXCLUDED.description,
            status = EXCLUDED.status;
    ''', (
        p["id"], p["barcode"], p["name"], p["brand"], p["category"], p["sub_category"], p["default_weight_or_size"],
        p["unit"], p["pack_size"], p["mrp"], p["selling_price"],
        round(((p["mrp"] - p["selling_price"]) / p["mrp"]) * 100, 1),
        p["image_url"], p["is_veg"],
        json.dumps(p["gallery"]),
        json.dumps([p["sub_category"]]),
        p["description"], "ACTIVE", f"SERVO-{p['id']}", "Brand Open Data", "Official Brand Media"
    ))

    # 2. Insert gallery images into product_images
    cur.execute('DELETE FROM product_images WHERE master_item_id = %s;', (p["id"],))
    for idx, img in enumerate(p["gallery"]):
        cur.execute('''
            INSERT INTO product_images (master_item_id, image_url, image_type, sort_order, caption)
            VALUES (%s, %s, %s, %s, %s);
        ''', (p["id"], img["url"], img["type"], idx, img.get("caption")))

    # 3. Insert or update multi-shop inventory offers
    for offer in p["offers"]:
        # Check if shop inventory record already exists for (shop_id, master_item_id)
        cur.execute('''
            SELECT id FROM shop_inventory WHERE shop_id = %s AND master_item_id = %s;
        ''', (offer["shop_id"], p["id"]))
        existing = cur.fetchone()

        if existing:
            cur.execute('''
                UPDATE shop_inventory SET
                    name = %s, category = %s, sub_category = %s, image_url = %s,
                    weight_or_size = %s, selling_price = %s, mrp = %s,
                    available_stock = %s, in_stock = true, is_pan_india_eligible = %s,
                    delivery_mode = %s, fulfillment_time_slot = %s
                WHERE id = %s;
            ''', (
                p["name"], p["category"], p["sub_category"], p["image_url"],
                p["default_weight_or_size"], offer["selling_price"], offer["mrp"],
                offer["stock"], offer["mode"] == "PAN_INDIA",
                offer["mode"], offer["eta"], existing[0]
            ))
        else:
            cur.execute('''
                INSERT INTO shop_inventory (
                    shop_id, master_item_id, is_not_listed_custom, name, category, sub_category,
                    image_url, gallery_images, weight_or_size, selling_price, mrp, total_stock,
                    sold_count, available_stock, low_stock_threshold, in_stock, is_pan_india_eligible,
                    is_veg, delivery_mode, fulfillment_time_slot, created_at
                ) VALUES (
                    %s, %s, false, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    0, %s, 5, true, %s,
                    %s, %s, %s, NOW()
                );
            ''', (
                offer["shop_id"], p["id"], p["name"], p["category"], p["sub_category"],
                p["image_url"], json.dumps(p["gallery"]), p["default_weight_or_size"],
                offer["selling_price"], offer["mrp"], offer["stock"] + 20,
                offer["stock"], offer["mode"] == "PAN_INDIA",
                p["is_veg"], offer["mode"], offer["eta"]
            ))

conn.commit()
print("Seed completed successfully! All products, gallery images, and multi-store inventory records committed.")

