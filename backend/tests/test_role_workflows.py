import httpx
import pytest
from sqlalchemy import select

from app.api.auth import create_access_token
from app.core.razorpay_client import razorpay_service
from app.db.models import PaymentIntent, User, WalletLedger
from app.main import app


def session(user_id, role):
    return {"Authorization": "Bearer " + create_access_token({"id": user_id, "role": role})}


@pytest.fixture
async def client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://localhost") as ac:
        yield ac


@pytest.fixture
def gateway(monkeypatch):
    class Gateway:
        sequence = 0
        orders = {}

        def order(self, amount, receipt, notes):
            self.sequence += 1
            order_id = f"fixture_{self.sequence}"
            self.orders[order_id] = round(amount * 100)
            return {"order_id": order_id, "amount_paise": self.orders[order_id]}

        def payment(self, payment_id):
            order_id = payment_id.removeprefix("payment_")
            return {"order_id": order_id, "status": "captured", "currency": "INR", "amount": self.orders[order_id]}

    fixture = Gateway()
    monkeypatch.setattr(razorpay_service, "is_configured", True)
    monkeypatch.setattr(razorpay_service, "create_order", fixture.order)
    monkeypatch.setattr(razorpay_service, "fetch_payment", fixture.payment)
    monkeypatch.setattr(razorpay_service, "verify_payment_signature", lambda **kwargs: True)


def callback(order_id):
    return {"razorpay_order_id": order_id, "razorpay_payment_id": f"payment_{order_id}",
            "razorpay_signature": "test-provider"}


@pytest.mark.asyncio
async def test_wallet_retry_credits_one_ledger_entry(client, test_database, gateway):
    headers = session(1, "customer")
    created = await client.post("/api/payments/wallet/topup/create-order", headers=headers, json={"amount": 100})
    data = callback(created.json()["payment_order"]["order_id"])
    for _ in range(2):
        reply = await client.post("/api/payments/wallet/topup/verify", headers=headers, json=data)
        assert reply.status_code == 200
        assert reply.json()["new_balance"] == 100
    async with test_database() as db:
        entries = (await db.scalars(select(WalletLedger))).all()
        assert [entry.amount for entry in entries] == [100]


@pytest.mark.asyncio
async def test_customer_seller_rider_order_and_admin_commission(client, test_database, gateway):
    customer, seller, rider, admin = session(1, "customer"), session(4, "seller"), session(2, "partner"), session(3, "admin")
    commission = await client.post("/api/admin/commissions", headers=admin, json={"category": "Grocery", "commission_pct": 7})
    assert commission.status_code == 200
    cart = {"shop_id": 1, "items": [{"inventory_id": 1, "quantity": 1}]}
    quote = (await client.post("/api/orders/cart-quote", json=cart)).json()
    assert quote["grand_total"] == 70
    created = await client.post("/api/payments/create-order", headers=customer, json={"amount": 70, "receipt": "test"})
    data = callback(created.json()["payment_order"]["order_id"])
    verified = await client.post("/api/payments/verify", headers=customer, json=data)
    assert verified.status_code == 200
    checkout = await client.post("/api/orders/checkout", headers=customer, json={
        **cart, "delivery_address": "1 Test Lane", "expected_total": 70,
        "payment_method": "CARD", "payment_id": data["razorpay_payment_id"],
    })
    assert checkout.status_code == 200
    order = checkout.json()["order"]
    order_id = order["id"]
    assert order["payment_status"] == "PAID"
    assert (await client.get(f"/api/orders/track/{order_id}")).status_code == 401
    assert (await client.get(f"/api/orders/track/{order_id}", headers=rider)).status_code == 404
    assert (await client.get(f"/api/orders/track/{order_id}", headers=customer)).status_code == 200
    inventory = (await client.get("/api/seller/inventory", headers=seller)).json()
    assert inventory[0]["available_stock"] == 99
    updated = await client.post(f"/api/seller/orders/{order_id}/status", headers=seller, json={"status": "READY_FOR_PICKUP"})
    assert updated.status_code == 200
    await client.post("/api/partner/duty-toggle", headers=rider, json={"is_on_duty": True})
    accepted = await client.post(f"/api/partner/orders/{order_id}/accept", headers=rider)
    assert accepted.status_code == 200
    assert "pickup_pin" not in accepted.json()
    pickup = await client.post("/api/partner/verify-pickup-pin", headers=rider,
                               json={"order_id": order_id, "pickup_pin": order["pickup_pin"]})
    assert pickup.status_code == 200
    before = (await client.get(f"/api/orders/track/{order_id}", headers=customer)).json()
    assert before["rider"]["location_updated_at"] is None
    beacon = {"order_id": order_id, "lat": 27.0521, "lng": 75.8975}
    assert (await client.post("/api/partner/update-gps", headers=rider, json=beacon)).status_code == 200
    live = (await client.get(f"/api/orders/track/{order_id}", headers=customer)).json()
    assert live["rider"]["lat"] == beacon["lat"]
    assert live["rider"]["location_updated_at"] is not None
    delivery_data = {"order_id": order_id, "delivery_pin": order["delivery_pin"]}
    delivered = await client.post("/api/partner/verify-delivery-pin", headers=rider, json=delivery_data)
    assert delivered.status_code == 200
    completed = (await client.get(f"/api/orders/track/{order_id}", headers=customer)).json()
    assert completed["rider"]["lat"] is None
    assert (await client.post("/api/partner/update-gps", headers=rider, json=beacon)).status_code == 404
    assert (await client.post("/api/partner/verify-delivery-pin", headers=rider, json=delivery_data)).status_code == 409
    report = (await client.get("/api/admin/overview", headers=admin)).json()
    assert report["platform_earnings"] == 4.9
    async with test_database() as db:
        assert (await db.scalar(select(PaymentIntent))).status == "APPLIED"
        assert (await db.get(User, 2)).wallet_balance == 25


@pytest.mark.asyncio
async def test_new_merchant_and_admin_approval(client, test_database):
    async with test_database.begin() as db:
        db.add(User(id=5, name="Second merchant", email="second@example.com", role="seller"))
    seller = session(5, "seller")
    assert (await client.get("/api/seller/inventory", headers=seller)).json() == []
    saved = await client.post("/api/seller/shop-setup", headers=seller,
                              json={"name": "Second Shop", "category": "Grocery"})
    shop = saved.json()["shop"]
    assert not shop["is_open"]
    assert (await client.post("/api/seller/shop-toggle", headers=seller, json={"is_open": True})).status_code == 403
    approved = await client.post(f"/api/admin/shops/{shop['id']}/approve", headers=session(3, "admin"),
                                 json={"is_approved": True})
    assert approved.status_code == 200
    assert (await client.get("/api/seller/shop", headers=seller)).json()["is_verified"]
    async with test_database.begin() as db:
        (await db.get(User, 5)).is_active = False
    assert (await client.get("/api/seller/inventory", headers=seller)).status_code == 401

@pytest.mark.asyncio
async def test_instant_coverage_requires_an_open_approved_shop(client):
    url = "/api/discovery/check-serviceability?lat=27.0544&lng=75.8942"
    assert (await client.get(url)).json()["shop_count"] == 1
    await client.post("/api/seller/shop-toggle", headers=session(4, "seller"), json={"is_open": False})
    unavailable = (await client.get(url)).json()
    assert unavailable["is_serviceable"] is False
    assert unavailable["shop_count"] == 0


@pytest.mark.asyncio
async def test_otp_registration_and_shop_approval(client, test_database):
    from datetime import datetime, timezone, timedelta
    from app.api.auth import hash_otp
    from app.db.models import UserOTP
    now = datetime.now(timezone.utc)
    async with test_database.begin() as db:
        db.add(UserOTP(email="merchant@example.com", otp_hash=hash_otp("348927"), attempts=0, is_used=False,
                       resend_available_at=now, expires_at=now + timedelta(minutes=5)))
    response = await client.post("/api/auth/register-partner", json={"role": "seller", "full_name": "Merchant",
                                 "email": "merchant@example.com", "otp_code": "348927", "shop_name": "Bakery"})
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING_APPROVAL"
    token = response.json()["access_token"]
    shop = await client.get("/api/seller/shop", headers={"Authorization": f"Bearer {token}"})
    assert shop.json()["name"] == "Bakery"
    assert shop.json()["is_open"] is False
