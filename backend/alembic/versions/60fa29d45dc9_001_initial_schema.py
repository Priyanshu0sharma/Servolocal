"""001_initial_schema

Revision ID: 60fa29d45dc9
Revises: 
Create Date: 2026-11-10 12:03:50.445530

Baseline migration establishing ServoLocal core schema with all required
tables, foreign keys, indexes, and JSON column extensions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60fa29d45dc9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('google_sub_id', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=150), nullable=False, server_default='User'),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='customer'),
        sa.Column('servo_coins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('wallet_balance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('dues_limit', sa.Float(), nullable=False, server_default='-200.0'),
        sa.Column('upi_id', sa.String(length=100), nullable=True),
        sa.Column('fcm_token', sa.String(length=500), nullable=True),
        sa.Column('terms_accepted', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('location_permission_granted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_google_sub_id'), 'users', ['google_sub_id'], unique=False)

    # 2. otp_verifications
    op.create_table(
        'otp_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('otp_code', sa.String(length=10), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='customer'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_otp_verifications_id'), 'otp_verifications', ['id'], unique=False)
    op.create_index(op.f('ix_otp_verifications_email'), 'otp_verifications', ['email'], unique=False)

    # 3. master_catalog_items
    op.create_table(
        'master_catalog_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('sub_category', sa.String(length=100), nullable=False),
        sa.Column('default_weight_or_size', sa.String(length=50), nullable=False),
        sa.Column('mrp', sa.Float(), nullable=False),
        sa.Column('selling_price', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('discount_percent', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('gallery_images', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('variants', sa.JSON(), nullable=True, server_default='[]'),
        sa.Column('is_veg', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('search_keywords', sa.Text(), nullable=True),
        sa.Column('paired_sub_categories', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_master_catalog_items_id'), 'master_catalog_items', ['id'], unique=False)
    op.create_index(op.f('ix_master_catalog_items_name'), 'master_catalog_items', ['name'], unique=False)
    op.create_index(op.f('ix_master_catalog_items_brand'), 'master_catalog_items', ['brand'], unique=False)
    op.create_index(op.f('ix_master_catalog_items_category'), 'master_catalog_items', ['category'], unique=False)
    op.create_index(op.f('ix_master_catalog_items_sub_category'), 'master_catalog_items', ['sub_category'], unique=False)

    # 4. shops
    op.create_table(
        'shops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_open', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('rating', sa.Float(), nullable=False, server_default='4.5'),
        sa.Column('management_mode', sa.String(length=50), nullable=False, server_default='SELLER_MANAGED'),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('locality_name', sa.String(length=100), nullable=False),
        sa.Column('delivery_scope', sa.String(length=50), nullable=False, server_default='LOCAL_ONLY'),
        sa.Column('delivery_radius_km', sa.Float(), nullable=False, server_default='3.0'),
        sa.Column('local_eta_mins', sa.String(length=50), nullable=False, server_default='15-20 mins'),
        sa.Column('national_eta_days', sa.String(length=50), nullable=False, server_default='3-5 Days'),
        sa.Column('custom_serviceable_areas', sa.JSON(), nullable=True, server_default='[]'),
        sa.Column('free_delivery_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('min_order_for_free_delivery', sa.Float(), nullable=False, server_default='150.0'),
        sa.Column('base_delivery_fee', sa.Float(), nullable=False, server_default='25.0'),
        sa.Column('seller_upi_id', sa.String(length=100), nullable=True),
        sa.Column('commission_rate_percent', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('onboarded_by_partner_id', sa.Integer(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['onboarded_by_partner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shops_id'), 'shops', ['id'], unique=False)
    op.create_index(op.f('ix_shops_name'), 'shops', ['name'], unique=False)
    op.create_index(op.f('ix_shops_category'), 'shops', ['category'], unique=False)
    op.create_index(op.f('ix_shops_locality_name'), 'shops', ['locality_name'], unique=False)

    # 5. shop_inventory
    op.create_table(
        'shop_inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('master_item_id', sa.Integer(), nullable=True),
        sa.Column('is_not_listed_custom', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('sub_category', sa.String(length=100), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('gallery_images', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('variants', sa.JSON(), nullable=True, server_default='[]'),
        sa.Column('is_veg', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('weight_or_size', sa.String(length=50), nullable=False),
        sa.Column('selling_price', sa.Float(), nullable=False),
        sa.Column('mrp', sa.Float(), nullable=False),
        sa.Column('total_stock', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('sold_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('available_stock', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('in_stock', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_pan_india_eligible', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['master_item_id'], ['master_catalog_items.id'], ),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shop_inventory_id'), 'shop_inventory', ['id'], unique=False)
    op.create_index(op.f('ix_shop_inventory_name'), 'shop_inventory', ['name'], unique=False)

    # 6. orders
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_code', sa.String(length=50), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('delivery_partner_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('delivery_scope', sa.String(length=50), nullable=False, server_default='LOCAL'),
        sa.Column('pickup_pin', sa.String(length=10), nullable=False),
        sa.Column('delivery_pin', sa.String(length=10), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='DIRECT_SHOP_UPI'),
        sa.Column('payment_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('razorpay_order_id', sa.String(length=100), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(length=100), nullable=True),
        sa.Column('items_total', sa.Float(), nullable=False),
        sa.Column('delivery_fee', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('platform_fee', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('discount_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('grand_total', sa.Float(), nullable=False),
        sa.Column('platform_commission_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('partner_earning_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('delivery_address', sa.Text(), nullable=False),
        sa.Column('delivery_lat', sa.Float(), nullable=True),
        sa.Column('delivery_lng', sa.Float(), nullable=True),
        sa.Column('customer_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['delivery_partner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)
    op.create_index(op.f('ix_orders_order_code'), 'orders', ['order_code'], unique=True)

    # 7. order_items
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('inventory_id', sa.Integer(), nullable=True),
        sa.Column('item_name', sa.String(length=200), nullable=False),
        sa.Column('weight_or_size', sa.String(length=50), nullable=True),
        sa.Column('variant_id', sa.String(length=50), nullable=True),
        sa.Column('selected_pack_label', sa.String(length=100), nullable=True),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['inventory_id'], ['shop_inventory.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_id'), 'order_items', ['id'], unique=False)

    # 8. order_reviews
    op.create_table(
        'order_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('partner_id', sa.Integer(), nullable=True),
        sa.Column('shop_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('partner_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['partner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    op.create_index(op.f('ix_order_reviews_id'), 'order_reviews', ['id'], unique=False)

    # 9. wallet_ledgers
    op.create_table(
        'wallet_ledgers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('balance_after', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wallet_ledgers_id'), 'wallet_ledgers', ['id'], unique=False)

    # 10. area_demand_requests
    op.create_table(
        'area_demand_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('locality_name', sa.String(length=150), nullable=False),
        sa.Column('pincode', sa.String(length=20), nullable=True),
        sa.Column('phone_or_email', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_area_demand_requests_id'), 'area_demand_requests', ['id'], unique=False)

    # 11. app_version_config
    op.create_table(
        'app_version_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('latest_version', sa.String(length=20), nullable=False, server_default='1.0.0'),
        sa.Column('min_required_version', sa.String(length=20), nullable=False, server_default='1.0.0'),
        sa.Column('force_update', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('update_message', sa.String(length=500), nullable=False, server_default='A brand new version of ServoLocal is available with performance improvements!'),
        sa.Column('playstore_url', sa.String(length=500), nullable=False, server_default='https://play.google.com/store/apps/details?id=in.servolocal.app'),
        sa.Column('maintenance_mode', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('maintenance_message', sa.String(length=500), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_app_version_config_id'), 'app_version_config', ['id'], unique=False)

    # 12. promo_banners
    op.create_table(
        'promo_banners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('target_route', sa.String(length=100), nullable=False, server_default='/'),
        sa.Column('badge_text', sa.String(length=50), nullable=True, server_default='SPECIAL OFFER'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_promo_banners_id'), 'promo_banners', ['id'], unique=False)

    # 13. coupons
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False, server_default='FLAT'),
        sa.Column('discount_value', sa.Float(), nullable=False),
        sa.Column('min_order_amount', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('max_discount_amount', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coupons_id'), 'coupons', ['id'], unique=False)
    op.create_index(op.f('ix_coupons_code'), 'coupons', ['code'], unique=True)


def downgrade() -> None:
    op.drop_table('coupons')
    op.drop_table('promo_banners')
    op.drop_table('app_version_config')
    op.drop_table('area_demand_requests')
    op.drop_table('wallet_ledgers')
    op.drop_table('order_reviews')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('shop_inventory')
    op.drop_table('shops')
    op.drop_table('master_catalog_items')
    op.drop_table('otp_verifications')
    op.drop_table('users')
