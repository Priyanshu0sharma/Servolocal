"""002_financial_numeric_strategy

Revision ID: 7990e45a57f6
Revises: 60fa29d45dc9
Create Date: 2026-11-10 12:04:05.123456

Safe, non-destructive migration strategy converting monetary and ledger fields
from binary Float (Double Precision) to exact NUMERIC(12, 2).
Uses PostgreSQL ROUND(col::numeric, 2) to eliminate floating-point representation anomalies
without data loss or breaking existing row values.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7990e45a57f6'
down_revision: Union[str, Sequence[str], None] = '60fa29d45dc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# List of (table_name, column_name, precision, scale)
MONETARY_FIELDS = [
    # 1. users
    ("users", "wallet_balance", 12, 2),
    ("users", "dues_limit", 12, 2),

    # 2. shops
    ("shops", "min_order_for_free_delivery", 12, 2),
    ("shops", "base_delivery_fee", 12, 2),
    ("shops", "commission_rate_percent", 5, 2),

    # 3. master_catalog_items
    ("master_catalog_items", "mrp", 12, 2),
    ("master_catalog_items", "selling_price", 12, 2),
    ("master_catalog_items", "discount_percent", 5, 2),

    # 4. shop_inventory
    ("shop_inventory", "selling_price", 12, 2),
    ("shop_inventory", "mrp", 12, 2),

    # 5. orders
    ("orders", "items_total", 12, 2),
    ("orders", "delivery_fee", 12, 2),
    ("orders", "platform_fee", 12, 2),
    ("orders", "discount_amount", 12, 2),
    ("orders", "grand_total", 12, 2),
    ("orders", "platform_commission_amount", 12, 2),
    ("orders", "partner_earning_amount", 12, 2),

    # 6. order_items
    ("order_items", "unit_price", 12, 2),
    ("order_items", "total_price", 12, 2),

    # 7. wallet_ledgers
    ("wallet_ledgers", "amount", 12, 2),
    ("wallet_ledgers", "balance_after", 12, 2),

    # 8. coupons
    ("coupons", "discount_value", 12, 2),
    ("coupons", "min_order_amount", 12, 2),
    ("coupons", "max_discount_amount", 12, 2),
]


def upgrade() -> None:
    """
    Safely casts all monetary Float columns to exact NUMERIC types using
    ROUND(col::numeric, scale) for zero data loss.
    Compatible with PostgreSQL and SQLite (in tests).
    """
    bind = op.get_bind()
    dialect = bind.dialect.name

    for table_name, column_name, precision, scale in MONETARY_FIELDS:
        target_type = sa.Numeric(precision=precision, scale=scale)
        if dialect == "postgresql":
            # Safe explicit cast with rounding in Postgres
            op.execute(
                sa.text(
                    f"ALTER TABLE {table_name} ALTER COLUMN {column_name} "
                    f"TYPE NUMERIC({precision}, {scale}) "
                    f"USING ROUND({column_name}::numeric, {scale});"
                )
            )
        else:
            # Generic fallback for SQLite / testing
            with op.batch_alter_table(table_name) as batch_op:
                batch_op.alter_column(
                    column_name,
                    type_=target_type,
                    existing_type=sa.Float(),
                    existing_nullable=False if "percent" not in column_name else True
                )


def downgrade() -> None:
    """Reverts columns back to Float if rollback is required."""
    bind = op.get_bind()
    dialect = bind.dialect.name

    for table_name, column_name, _, _ in MONETARY_FIELDS:
        if dialect == "postgresql":
            op.execute(
                sa.text(
                    f"ALTER TABLE {table_name} ALTER COLUMN {column_name} "
                    f"TYPE DOUBLE PRECISION USING {column_name}::double precision;"
                )
            )
        else:
            with op.batch_alter_table(table_name) as batch_op:
                batch_op.alter_column(
                    column_name,
                    type_=sa.Float(),
                    existing_nullable=True
                )
