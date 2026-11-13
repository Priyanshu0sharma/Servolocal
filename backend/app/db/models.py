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
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=False, default="Local")
    category = Column(String(255), nullable=False)
    sub_category = Column(String(255), nullable=False)
    default_weight_or_size = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=True)
    pack_size = Column(String(50), nullable=True)
    mrp = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=True)
    discount_percent = Column(Float, nullable=True, default=0.0)
    image_url = Column(String(1000), nullable=False)
    is_veg = Column(Boolean, default=True, nullable=True)
    gallery_images = Column(JSON, default=list, nullable=False)
    paired_sub_categories = Column(JSON, default=list, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)
    source_id = Column(String(100), nullable=True)
    license = Column(String(100), default="Brand Open Catalogue", nullable=True)
    attribution = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    master_item_id = Column(Integer, ForeignKey("master_catalog_items.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(1000), nullable=False)
    image_type = Column(String(50), default="FRONT", nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    caption = Column(String(255), nullable=True)


class ShopInventory(Base):
    __tablename__ = "shop_inventory"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    master_item_id = Column(Integer, nullable=True)
    is_not_listed_custom = Column(Boolean, default=False, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    sub_category = Column(String(255), nullable=True)
    image_url = Column(String(1000), nullable=False)
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
    delivery_mode = Column(String(50), default="IN_MINUTES", nullable=False)
    fulfillment_time_slot = Column(String(50), default="10-15 Mins", nullable=False)
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


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label = Column(String(50), nullable=False, default="Home")
    line1 = Column(String(500), nullable=False)
    locality = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    lat = Column(Float, nullable=False, default=27.0544)
    lng = Column(Float, nullable=False, default=75.8942)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PartnerProfile(Base):
    __tablename__ = "partner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vehicle_type = Column(String(100), nullable=True, default="Bike")
    vehicle_number = Column(String(50), nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    lat = Column(Float, nullable=True, default=27.0544)
    lng = Column(Float, nullable=True, default=75.8942)
    rating = Column(Float, default=4.9, nullable=False)
    rating_count = Column(Integer, default=0, nullable=False)
    onboarding_royalty_orders = Column(Integer, default=0, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PaymentIntent(Base):
    __tablename__ = "payment_intents"

    id = Column(Integer, primary_key=True, index=True)
    purpose = Column(String(100), nullable=False, default="ORDER_PAYMENT")
    shop_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True)
    amount = Column(Float, nullable=False)
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="CREATED", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class OrderEvent(Base):
    __tablename__ = "order_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class WalletLedger(Base):
    __tablename__ = "wallet_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    order_id = Column(Integer, nullable=True)
    entry_type = Column(String(50), nullable=False)  # CREDIT, DEBIT, CASH_COLLECTION, COMMISSION, SETTLEMENT
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    discount_type = Column(String(50), nullable=False, default="FLAT")  # FLAT, PERCENTAGE, FREE_DELIVERY
    value = Column(Float, nullable=False)
    min_order_value = Column(Float, default=0.0, nullable=False)
    max_discount = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class AppVersionConfig(Base):
    __tablename__ = "app_version_config"

    id = Column(Integer, primary_key=True, index=True)
    latest_version = Column(String(50), nullable=False, default="1.0.0")
    min_required_version = Column(String(50), nullable=False, default="1.0.0")
    force_update = Column(Boolean, default=False, nullable=False)
    update_message = Column(String(255), nullable=False, default="Please update to the latest ServoLocal version.")
    playstore_url = Column(String(255), nullable=False, default="https://play.google.com/store/apps")
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    maintenance_message = Column(String(255), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PromoBanner(Base):
    __tablename__ = "promo_banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    image_url = Column(String(1000), nullable=False)
    target_route = Column(String(255), nullable=False, default="/")
    badge_text = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AreaDemandRequest(Base):
    __tablename__ = "area_demand_requests"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    locality_name = Column(String(255), nullable=False)
    pincode = Column(String(20), nullable=True)
    phone_or_email = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO", nullable=False)  # ORDER, PROMO, WALLET, SYSTEM
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(Integer, nullable=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, URGENT
    admin_response = Column(Text, nullable=True)
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


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
