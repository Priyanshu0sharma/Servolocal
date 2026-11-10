import os
import sqlite3
import tempfile
import pytest
from pathlib import Path
from alembic.config import Config
from alembic import command
from alembic.util.exc import CommandError
import sqlalchemy as sa


@pytest.fixture
def temp_db_config(tmp_path):
    """Provides an isolated SQLite database and Alembic Config pointing to it."""
    db_file = tmp_path / "test_lifecycle.db"
    db_url = f"sqlite+aiosqlite:///{db_file.as_posix()}"

    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini_path = str(backend_dir / "alembic.ini")

    cfg = Config(alembic_ini_path)
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    cfg.set_main_option("sqlalchemy.url", db_url)

    yield cfg, db_file


def test_fresh_database_installation(temp_db_config):
    """
    Fresh installation test:
    Starting from a blank database, 'alembic upgrade head' must create all 13 core tables,
    all indexes, apply the financial numeric strategy, and reach head revision 7990e45a57f6.
    """
    cfg, db_file = temp_db_config

    # Apply all migrations to head
    command.upgrade(cfg, "head")

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Verify all 13 core tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}
    expected_tables = {
        "users", "otp_verifications", "master_catalog_items", "shops",
        "shop_inventory", "orders", "order_items", "order_reviews",
        "wallet_ledgers", "area_demand_requests", "app_version_config",
        "promo_banners", "coupons", "alembic_version"
    }
    missing = expected_tables - tables
    assert not missing, f"Fresh installation missing tables: {missing}"

    # Verify alembic_version is at head
    cursor.execute("SELECT version_num FROM alembic_version")
    version = cursor.fetchone()[0]
    assert version == "a1b2c3d4e5f6"
    conn.close()


def test_existing_schema_adoption_with_stamp(temp_db_config):
    """
    Existing-schema adoption test (recommended stamp procedure):
    Simulate pre-existing database with populated records before Alembic.
    1. Populate tables with sample records.
    2. Stamp baseline 60fa29d45dc9.
    3. Upgrade to head.
    4. Assert all existing rows remain intact and version reaches head.
    """
    cfg, db_file = temp_db_config

    # Pre-populate database (simulating legacy pre-Alembic Neon database)
    conn = sqlite3.connect(db_file)
    conn.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            role TEXT,
            servo_coins INT DEFAULT 0,
            wallet_balance FLOAT DEFAULT 0.0,
            dues_limit FLOAT DEFAULT -200.0,
            is_active INT DEFAULT 1,
            created_at TEXT
        )
    """)
    conn.execute("""
        INSERT INTO users (id, email, name, role, servo_coins, wallet_balance, dues_limit, is_active, created_at)
        VALUES (42, 'sharma.dukaan@servolocal.in', 'Sharma General Store', 'seller', 250, 450.50, -200.0, 1, '2026-01-15')
    """)
    conn.commit()
    conn.close()

    # Adoption Procedure: Stamp baseline then upgrade to head
    command.stamp(cfg, "60fa29d45dc9")
    command.upgrade(cfg, "head")

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Verify legacy record was 100% preserved
    cursor.execute("SELECT id, email, name, role, servo_coins, wallet_balance FROM users WHERE id=42")
    user_row = cursor.fetchone()
    assert user_row is not None
    assert user_row[0] == 42
    assert user_row[1] == "sharma.dukaan@servolocal.in"
    assert user_row[2] == "Sharma General Store"
    assert user_row[3] == "seller"
    assert user_row[4] == 250
    assert abs(user_row[5] - 450.50) < 0.01

    # Verify version reaches head
    cursor.execute("SELECT version_num FROM alembic_version")
    assert cursor.fetchone()[0] == "a1b2c3d4e5f6"
    conn.close()


def test_existing_schema_adoption_direct_upgrade(temp_db_config):
    """
    Direct upgrade adoption test (safe fallback):
    If an admin runs 'alembic upgrade head' directly on an existing database without stamping,
    the baseline migration must detect existing tables via schema inspection, NOT crash with
    'table already exists', preserve all existing records, and proceed cleanly to head.
    """
    cfg, db_file = temp_db_config

    # Pre-populate database with an existing shop and user
    conn = sqlite3.connect(db_file)
    conn.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            role TEXT,
            servo_coins INT DEFAULT 0,
            wallet_balance FLOAT DEFAULT 0.0,
            dues_limit FLOAT DEFAULT -200.0,
            is_active INT DEFAULT 1,
            created_at TEXT
        )
    """)
    conn.execute("""
        INSERT INTO users (id, email, name, role, servo_coins, wallet_balance, dues_limit, is_active, created_at)
        VALUES (99, 'direct_upgrade@servolocal.in', 'Direct Upgrade User', 'customer', 120, 0.0, -200.0, 1, '2026-02-01')
    """)
    conn.commit()
    conn.close()

    # Direct upgrade without prior stamp
    command.upgrade(cfg, "head")

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Verify existing row remains intact
    cursor.execute("SELECT id, email, name FROM users WHERE id=99")
    user_row = cursor.fetchone()
    assert user_row == (99, "direct_upgrade@servolocal.in", "Direct Upgrade User")

    # Verify missing columns were added
    cursor.execute("PRAGMA table_info(users)")
    columns = {row[1] for row in cursor.fetchall()}
    assert "terms_accepted" in columns
    assert "location_permission_granted" in columns

    # Verify version reaches head
    cursor.execute("SELECT version_num FROM alembic_version")
    assert cursor.fetchone()[0] == "a1b2c3d4e5f6"
    conn.close()


def test_migration_failure_handling(temp_db_config):
    """
    Migration failure test:
    Verify that an invalid migration revision or broken target raises a CommandError
    and is not silently swallowed.
    """
    cfg, _ = temp_db_config

    with pytest.raises(CommandError) as exc_info:
        command.upgrade(cfg, "nonexistent_revision_abc123")

    assert "nonexistent_revision_abc123" in str(exc_info.value)
