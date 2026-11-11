from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="customer")
    password_hash = Column(String(255), nullable=True)
    servo_coins = Column(Integer, default=150, nullable=False)
    wallet_balance = Column(Float, default=0.0, nullable=False)
    dues_limit = Column(Float, default=500.0, nullable=False)
    upi_id = Column(String(255), nullable=True)
    fcm_token = Column(String(255), nullable=True)
    terms_accepted = Column(Boolean, default=True, nullable=False)
    location_permission_granted = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=False, default=1)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    is_open = Column(Boolean, default=True, nullable=False)
    rating = Column(Float, default=4.8, nullable=False)
    management_mode = Column(String(50), default="DIRECT_MERCHANT", nullable=False)
    lat = Column(Float, default=27.0544, nullable=False)
    lng = Column(Float, default=75.8942, nullable=False)
    locality_name = Column(String(255), nullable=False)
    delivery_scope = Column(String(50), default="LOCAL_ONLY", nullable=False)
    delivery_radius_km = Column(Float, default=5.0, nullable=False)
    local_eta_mins = Column(String(50), default="⚡ 10 mins", nullable=False)
    national_eta_days = Column(String(50), default="3-5 Days", nullable=False)
    free_delivery_enabled = Column(Boolean, default=True, nullable=False)
    min_order_for_free_delivery = Column(Float, default=150.0, nullable=False)
    base_delivery_fee = Column(Float, default=15.0, nullable=False)
    seller_upi_id = Column(String(255), nullable=True)
    commission_rate_percent = Column(Float, default=5.0, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class MasterCatalogItem(Base):
    __tablename__ = "master_catalog_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=False, default="Local")
    category = Column(String(255), nullable=False)
    sub_category = Column(String(255), nullable=False)
    default_weight_or_size = Column(String(100), nullable=False)
    mrp = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=True)
    discount_percent = Column(Float, nullable=True, default=0.0)
    image_url = Column(String(500), nullable=False)
    is_veg = Column(Boolean, default=True, nullable=True)
    gallery_images = Column(JSON, default=list, nullable=False)
    paired_sub_categories = Column(JSON, default=list, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ShopInventory(Base):
    __tablename__ = "shop_inventory"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    master_item_id = Column(Integer, nullable=True)
    is_not_listed_custom = Column(Boolean, default=False, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    sub_category = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=False)
    gallery_images = Column(JSON, default=list, nullable=False)
    weight_or_size = Column(String(100), nullable=False)
    selling_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    total_stock = Column(Integer, default=100, nullable=False)
    sold_count = Column(Integer, default=0, nullable=False)
    available_stock = Column(Integer, default=100, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    in_stock = Column(Boolean, default=True, nullable=False)
    is_pan_india_eligible = Column(Boolean, default=False, nullable=False)
    is_veg = Column(Boolean, default=True, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    delivery_partner_id = Column(Integer, nullable=True)
    status = Column(String(50), default="PLACED", nullable=False)
    delivery_scope = Column(String(50), default="LOCAL_ONLY", nullable=False)
    pickup_pin = Column(String(10), nullable=False)
    delivery_pin = Column(String(10), nullable=False)
    payment_method = Column(String(50), default="DIRECT_SHOP_UPI", nullable=False)
    payment_status = Column(String(50), default="PAID", nullable=False)
    items_total = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0, nullable=False)
    platform_fee = Column(Float, default=5.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, nullable=False)
    platform_commission_amount = Column(Float, default=0.0, nullable=False)
    partner_earning_amount = Column(Float, default=25.0, nullable=False)
    delivery_address = Column(Text, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    customer_notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    inventory_id = Column(Integer, nullable=False)
    item_name = Column(String(255), nullable=False)
    weight_or_size = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)


class OrderReview(Base):
    __tablename__ = "order_reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    partner_id = Column(Integer, nullable=True)
    shop_rating = Column(Integer, default=5, nullable=False)
    partner_rating = Column(Integer, default=5, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UserOTP(Base):
    __tablename__ = "user_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    resend_available_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
