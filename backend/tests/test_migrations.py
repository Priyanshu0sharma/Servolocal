import os
from pathlib import Path
import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from app.db.database import Base
# Ensure all models are imported so Base.metadata is populated
import app.db.models  # noqa: F401


def test_alembic_configuration_exists():
    """Verify alembic.ini and env.py exist in the backend folder."""
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini = backend_dir / "alembic.ini"
    alembic_env = backend_dir / "alembic" / "env.py"

    assert alembic_ini.exists(), "alembic.ini must exist"
    assert alembic_env.exists(), "backend/alembic/env.py must exist"


def test_target_metadata_registers_all_13_tables():
    """Verify Alembic target_metadata has discovered all 13 core database models."""
    expected_tables = {
        "users",
        "otp_verifications",
        "master_catalog_items",
        "shops",
        "shop_inventory",
        "orders",
        "order_items",
        "order_reviews",
        "wallet_ledgers",
        "area_demand_requests",
        "app_version_config",
        "promo_banners",
        "coupons",
    }
    registered_tables = set(Base.metadata.tables.keys())
    missing = expected_tables - registered_tables
    assert not missing, f"The following models are missing from Alembic metadata: {missing}"


def test_alembic_script_directory_and_revisions():
    """Verify Alembic script directory recognizes migration heads and dependency order."""
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini_path = str(backend_dir / "alembic.ini")

    config = Config(alembic_ini_path)
    config.set_main_option("script_location", str(backend_dir / "alembic"))

    script = ScriptDirectory.from_config(config)

    # Check heads
    heads = script.get_heads()
    assert len(heads) == 1, f"Expected exactly 1 migration head, found {heads}"
    head_rev = heads[0]
    assert head_rev == "7990e45a57f6"

    # Walk revisions from head to base
    revisions = list(script.walk_revisions())
    rev_ids = [r.revision for r in revisions]
    assert "7990e45a57f6" in rev_ids
    assert "60fa29d45dc9" in rev_ids

    # Check revision 001 down_revision is None
    rev_001 = script.get_revision("60fa29d45dc9")
    assert rev_001.down_revision is None

    # Check revision 002 down_revision is 001
    rev_002 = script.get_revision("7990e45a57f6")
    assert rev_002.down_revision == "60fa29d45dc9"


def test_financial_numeric_strategy_fields():
    """Verify all 24 monetary fields are tracked in revision 002."""
    import importlib.util

    backend_dir = Path(__file__).resolve().parent.parent
    rev_file = backend_dir / "alembic" / "versions" / "7990e45a57f6_002_financial_numeric_strategy.py"

    spec = importlib.util.spec_from_file_location("rev_002", rev_file)
    rev_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rev_mod)

    monetary_fields = getattr(rev_mod, "MONETARY_FIELDS", [])
    assert len(monetary_fields) == 24, f"Expected 24 monetary fields, found {len(monetary_fields)}"

    # Check critical wallet, order, shop, and coupon fields
    field_tuples = [(t[0], t[1]) for t in monetary_fields]
    assert ("users", "wallet_balance") in field_tuples
    assert ("users", "dues_limit") in field_tuples
    assert ("shops", "min_order_for_free_delivery") in field_tuples
    assert ("shop_inventory", "selling_price") in field_tuples
    assert ("orders", "grand_total") in field_tuples
    assert ("orders", "platform_commission_amount") in field_tuples
    assert ("wallet_ledgers", "amount") in field_tuples
    assert ("coupons", "discount_value") in field_tuples
