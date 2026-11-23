import sys
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.razorpay_client import razorpay_service
from app.core.redis_client import redis_client
from app.db.base import Base
from app.db.models import User, Shop, ShopInventory
from app.db.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
async def test_database(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with sessions.begin() as db:
        db.add_all(User(id=i, name=role, email=f"{role}@example.com", role=role)
                   for i, role in enumerate(["customer", "partner", "admin", "seller"], 1))
        db.add(Shop(id=1, owner_id=4, name="Test Shop", category="Grocery", locality_name="Kukas"))
        db.add(ShopInventory(id=1, shop_id=1, name="Milk", category="Dairy", image_url="milk.png",
                             weight_or_size="1 L", selling_price=50, mrp=55))
    async def local_db():
        async with sessions() as session:
            yield session

    monkeypatch.setitem(app.dependency_overrides, get_db, local_db)
    monkeypatch.setattr(redis_client, "is_configured", False)
    monkeypatch.setattr(razorpay_service, "_client", None)
    monkeypatch.setattr(razorpay_service, "is_configured", False)
    try:
        yield sessions
    finally:
        await engine.dispose()
