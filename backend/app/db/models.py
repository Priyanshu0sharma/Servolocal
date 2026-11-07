from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    func,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    """
    Unified User model supporting Customer, Seller, Delivery Partner, and Super Admin.
    Tracks wallet balance, negative dues limit (-₹200 cutoff), and ServoCoins.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    google_sub_id = Column(String(255), nullable=True, index=True)
    name = Column(String(150), nullable=False, default="User")
    role = Column(String(50), nullable=False, default="customer")  # customer, seller, partner, admin
    servo_coins = Column(Integer, default=0, nullable=False)
    wallet_balance = Column(Float, default=0.0, nullable=False)  # Negative means dues owed to ServoLocal
    dues_limit = Column(Float, default=-200.0, nullable=False)   # Account auto-locked if balance < dues_limit
    upi_id = Column(String(100), nullable=True)                  # For direct UPI payout / settlement
    fcm_token = Column(String(500), nullable=True)               # Push notifications / loud buzzer ring
    terms_accepted = Column(Boolean, default=True, nullable=False) # Razorpay & Play Store Compliance
    location_permission_granted = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    shops = relationship("Shop", back_populates="owner", foreign_keys="Shop.owner_id")
    onboarded_shops = relationship("Shop", back_populates="onboarded_by_partner", foreign_keys="Shop.onboarded_by_partner_id")
    orders_placed = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    deliveries_assigned = relationship("Order", back_populates="partner", foreign_keys="Order.delivery_partner_id")
    reviews_given = relationship("OrderReview", back_populates="customer", foreign_keys="OrderReview.customer_id")
    ledger_entries = relationship("WalletLedger", back_populates="user", cascade="all, delete-orphan")


class OTPVerification(Base):
    """
    Stores 6-digit cryptographic OTPs with expiration and usage status.
    """
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    role = Column(String(50), default="customer", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MasterCatalogItem(Base):
    """
    Pre-Loaded Real Brand Master Catalog (Zero Photo Hassle for Sellers).
    Sellers search, tick, and set their price. Includes distinct packaging variants.
    """
    __tablename__ = "master_catalog_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False)
    brand = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)        # Kirana, Fast Food, Sweets, Clothes, Custom/3D
    sub_category = Column(String(100), nullable=False, index=True)    # Dairy & Milk, Maggi & Biscuits, Chips & Snacks, etc.
    default_weight_or_size = Column(String(50), nullable=False)       # 50g, 100g, 500ml, 1 pc
    mrp = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=False)
    gallery_images = Column(JSON, default=list, nullable=False)       # List of image URLs
    variants = Column(JSON, default=list, nullable=True)               # Multi-pack options: [{"id": "var_1", "weight_or_size": "70g", "price": 16.0, "mrp": 20.0, "discount_pct": 20, "is_default": true}, ...]
    is_veg = Column(Boolean, default=True, nullable=False)             # Indian FSSAI Veg Green Dot [⊡]
    search_keywords = Column(Text, nullable=True)                     # Comma-separated or full-text keywords
    paired_sub_categories = Column(JSON, default=list, nullable=False) # Cross-sell suggestions (e.g. Chai + Biscuits)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    inventory_links = relationship("ShopInventory", back_populates="master_item")


class Shop(Base):
    """
    Local vendor stall or retail store with strict area isolation, delivery radius,
    1-tap open/close toggle, and runner/proxy stall mode for uncooperative stalls.
    """
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    is_open = Column(Boolean, default=True, nullable=False)           # 1-Tap Toggle: Green OPEN <-> Grayscale CLOSED
    rating = Column(Float, default=4.5, nullable=False)
    management_mode = Column(String(50), default="SELLER_MANAGED", nullable=False)  # SELLER_MANAGED, PARTNER_RUNNER_STALL
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    locality_name = Column(String(100), index=True, nullable=False)    # Kukas, Kunda, Amer, etc.
    delivery_scope = Column(String(50), default="LOCAL_ONLY", nullable=False) # LOCAL_ONLY, PAN_INDIA, BOTH
    delivery_radius_km = Column(Float, default=3.0, nullable=False)   # Dukandaar Slider (1 to 15 km)
    local_eta_mins = Column(String(50), default="15-20 mins", nullable=False)
    national_eta_days = Column(String(50), default="3-5 Days", nullable=False)
    custom_serviceable_areas = Column(JSON, default=list, nullable=True) # Multi-Village routes: [{"area_name": "Balwantpura", "eta_label": "6-7 hrs (Same Day)", "delivery_fee": 20.0}]
    free_delivery_enabled = Column(Boolean, default=True, nullable=False)
    min_order_for_free_delivery = Column(Float, default=150.0, nullable=False)
    base_delivery_fee = Column(Float, default=25.0, nullable=False)
    seller_upi_id = Column(String(100), nullable=True)                # Direct UPI Intent target
    commission_rate_percent = Column(Float, default=10.0, nullable=False) # e.g. 10.0%
    onboarded_by_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Lifetime Partner Royalty
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="shops", foreign_keys=[owner_id])
    onboarded_by_partner = relationship("User", back_populates="onboarded_shops", foreign_keys=[onboarded_by_partner_id])
    inventory = relationship("ShopInventory", back_populates="shop", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="shop")
    reviews = relationship("OrderReview", back_populates="shop")


class ShopInventory(Base):
    """
    Shop's active inventory items. Links to MasterCatalogItem OR custom "+ Not Listed" items.
    """
    __tablename__ = "shop_inventory"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    master_item_id = Column(Integer, ForeignKey("master_catalog_items.id"), nullable=True)
    is_not_listed_custom = Column(Boolean, default=False, nullable=False) # Top "+ Item Not Listed" Custom Upload

    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=False)
    gallery_images = Column(JSON, default=list, nullable=False)
    variants = Column(JSON, default=list, nullable=True)               # Inherited or customized multi-pack options
    is_veg = Column(Boolean, default=True, nullable=False)             # Indian FSSAI Veg Green Dot
    weight_or_size = Column(String(50), nullable=False)
    selling_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)

    # Stock & Inventory Controls
    total_stock = Column(Integer, default=50, nullable=False)
    sold_count = Column(Integer, default=0, nullable=False)
    available_stock = Column(Integer, default=50, nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    in_stock = Column(Boolean, default=True, nullable=False)
    is_pan_india_eligible = Column(Boolean, default=False, nullable=False) # Ships All India • 3-5 Days
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    shop = relationship("Shop", back_populates="inventory")
    master_item = relationship("MasterCatalogItem", back_populates="inventory_links")
    order_items = relationship("OrderItem", back_populates="inventory_item")


class Order(Base):
    """
    Complete order lifecycle: PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED.
    Enforces pickup and delivery verification PINs and Stage 1 / Stage 2 payment routing.
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False) # E.g. SL-202611-8931
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    delivery_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String(50), default="PENDING", nullable=False) # PENDING, ACCEPTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    delivery_scope = Column(String(50), default="LOCAL", nullable=False) # LOCAL, PAN_INDIA

    # Verification PINs for Fraud Prevention
    pickup_pin = Column(String(10), nullable=False)   # 2-digit PIN verified by partner at shop
    delivery_pin = Column(String(10), nullable=False) # 4-digit PIN verified by partner with customer

    # Payment Details
    payment_method = Column(String(50), default="DIRECT_SHOP_UPI", nullable=False) # RAZORPAY, DIRECT_SHOP_UPI, COD
    payment_status = Column(String(50), default="PENDING", nullable=False)         # PENDING, COMPLETED, FAILED, REFUNDED
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)

    # Financial Ledger Breakdown
    items_total = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0, nullable=False)
    platform_fee = Column(Float, default=5.0, nullable=False)   # ₹5 ServoLocal base fee
    discount_amount = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, nullable=False)

    # Commissions & Partner Payout Splits
    platform_commission_amount = Column(Float, default=0.0, nullable=False)
    partner_earning_amount = Column(Float, default=0.0, nullable=False)

    # Geo & Address
    delivery_address = Column(Text, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    customer_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    customer = relationship("User", back_populates="orders_placed", foreign_keys=[customer_id])
    shop = relationship("Shop", back_populates="orders", foreign_keys=[shop_id])
    partner = relationship("User", back_populates="deliveries_assigned", foreign_keys=[delivery_partner_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    review = relationship("OrderReview", back_populates="order", uselist=False)
    ledger_records = relationship("WalletLedger", back_populates="order")


class OrderItem(Base):
    """
    Individual items inside an order.
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("shop_inventory.id"), nullable=True)

    item_name = Column(String(200), nullable=False)
    weight_or_size = Column(String(50), nullable=True)
    variant_id = Column(String(50), nullable=True)                    # E.g. "var_1"
    selected_pack_label = Column(String(100), nullable=True)          # E.g. "2 x 70 g"
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    total_price = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    inventory_item = relationship("ShopInventory", back_populates="order_items")


class OrderReview(Base):
    """
    Rating and feedback for shop and delivery partner.
    """
    __tablename__ = "order_reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    shop_rating = Column(Integer, default=5, nullable=False)     # 1 to 5 stars
    partner_rating = Column(Integer, default=5, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="review")
    customer = relationship("User", back_populates="reviews_given", foreign_keys=[customer_id])
    shop = relationship("Shop", back_populates="reviews", foreign_keys=[shop_id])


class WalletLedger(Base):
    """
    Tracks all financial movements: Platform fee debits, commission deductions,
    Razorpay dues recharges, and runner stall payouts.
    Enforces the -₹200 dues cutoff rule.
    """
    __tablename__ = "wallet_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    transaction_type = Column(String(50), nullable=False) # COMMISSION_DEBIT, PLATFORM_FEE_DEBIT, RAZORPAY_RECHARGE, PARTNER_PAYOUT, ADJUSTMENT
    amount = Column(Float, nullable=False)                # Negative for debit (-₹15), positive for recharge (+₹200)
    balance_after = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="ledger_entries")
    order = relationship("Order", back_populates="ledger_records")


class AreaDemandRequest(Base):
    """
    Captures user demand in currently unserviceable GPS coordinates or pincodes
    so Admin can prioritize expanding delivery fleet and onboarding local vendors.
    """
    __tablename__ = "area_demand_requests"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    locality_name = Column(String(150), nullable=False)
    pincode = Column(String(20), nullable=True)
    phone_or_email = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AppVersionConfig(Base):
    """
    Super Admin controlled dynamic app versioning and update modal.
    Enforces forced or soft updates without hard app recompilation.
    """
    __tablename__ = "app_version_config"

    id = Column(Integer, primary_key=True, index=True)
    latest_version = Column(String(20), default="1.0.0", nullable=False)
    min_required_version = Column(String(20), default="1.0.0", nullable=False)
    force_update = Column(Boolean, default=False, nullable=False)
    update_message = Column(String(500), default="A brand new version of ServoLocal is available with performance improvements!", nullable=False)
    playstore_url = Column(String(500), default="https://play.google.com/store/apps/details?id=in.servolocal.app", nullable=False)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    maintenance_message = Column(String(500), default="ServoLocal is undergoing scheduled speed optimizations.", nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PromoBanner(Base):
    """
    Dynamic promotional banners displayed in customer and partner apps.
    Admin can toggle or re-order banners without pushing frontend code.
    """
    __tablename__ = "promo_banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    image_url = Column(String(500), nullable=False)
    target_route = Column(String(100), default="/", nullable=False)
    badge_text = Column(String(50), default="SPECIAL OFFER", nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)



