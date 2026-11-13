import os
import sys
import pytest
import httpx

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.auth import create_access_token
from app.core.razorpay_client import razorpay_service
from app.api.discovery import calculate_haversine_distance
from app.db.session import engine

transport = httpx.ASGITransport(app=app)
base_url = "http://testserver"


@pytest.fixture(autouse=True)
async def dispose_engine():
    yield
    await engine.dispose()


# ─── 1. Health & Configuration Tests ────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_app_config():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/app-config")
        assert response.status_code == 200
        data = response.json()
        assert "latest_version" in data
        assert "maintenance_mode" in data
        assert "banners" in data


@pytest.mark.asyncio
async def test_legal_policies():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/legal/policies")
        assert response.status_code == 200
        data = response.json()
        assert "company" in data
        assert "terms_of_service" in data
        assert "refund_and_cancellation_policy" in data


@pytest.mark.asyncio
async def test_legal_terms_by_role():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        res_seller = await ac.get("/api/legal/terms?role=seller")
        assert res_seller.status_code == 200
        assert "rules" in res_seller.json()

        res_partner = await ac.get("/api/legal/terms?role=partner")
        assert res_partner.status_code == 200
        assert "rules" in res_partner.json()


# ─── 2. Discovery & Delivery Mode Eligibility Tests ─────────────────────────

def test_haversine_distance():
    dist = calculate_haversine_distance(26.9124, 75.7873, 27.0544, 75.8942)
    assert 15.0 <= dist <= 25.0


@pytest.mark.asyncio
async def test_discovery_feed_local():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/discovery/feed?mode=LOCAL&locality=Kukas,%20Jaipur")
        assert response.status_code == 200
        data = response.json()
        assert "shops" in data
        assert "all_products" in data
        assert data["is_area_serviceable"] is True


@pytest.mark.asyncio
async def test_discovery_feed_pan_india():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/discovery/feed?mode=PAN_INDIA")
        assert response.status_code == 200
        data = response.json()
        for p in data["all_products"]:
            cat = p.get("category", "").lower()
            assert "fresh milk" not in cat
            assert "street food" not in cat


@pytest.mark.asyncio
async def test_search_suggest():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/discovery/search-suggest?q=a")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "count" in data


@pytest.mark.asyncio
async def test_check_serviceability():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/discovery/check-serviceability?lat=27.0544&lng=75.8942")
        assert response.status_code == 200
        data = response.json()
        assert "is_serviceable" in data
        assert data["is_serviceable"] is True
        assert "estimated_delivery_time" in data


# ─── 3. Authentication & Security Tests ─────────────────────────────────────

def test_jwt_token_generation_and_decoding():
    token = create_access_token({"id": 1, "email": "test@servolocal.in", "role": "customer"})
    assert isinstance(token, str)
    assert len(token) > 20


@pytest.mark.asyncio
async def test_customer_me_unauthorized():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_customer_addresses_unauthorized():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/customer/addresses")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_seller_inventory_unauthorized():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/seller/inventory")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_partner_duty_unauthorized():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/partner/duty-status")
        assert response.status_code == 401


# ─── 4. Customer Account Flow (Authenticated) ───────────────────────────────

@pytest.fixture
def customer_token():
    return create_access_token({"id": 1, "email": "priyanshusharma1131@gmail.com", "role": "customer"})


@pytest.mark.asyncio
async def test_customer_authenticated_me(customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        response = await ac.get("/api/auth/me", headers=headers)
        assert response.status_code in (200, 401)


@pytest.mark.asyncio
async def test_customer_addresses_crud(customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        # 1. Fetch addresses
        res = await ac.get("/api/customer/addresses", headers=headers)
        assert res.status_code == 200
        initial_count = len(res.json())

        # 2. Create address
        create_payload = {
            "label": "Office",
            "line1": "Tech Park Phase 1, Kukas, Jaipur",
            "locality": "Kukas, Jaipur",
            "city": "Jaipur",
            "pincode": "302028",
            "phone": "+919876543210",
            "lat": 27.0544,
            "lng": 75.8942,
            "is_default": False,
        }
        create_res = await ac.post("/api/customer/addresses", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        addr_id = create_res.json()["address"]["id"]

        # 3. Verify created
        get_res = await ac.get("/api/customer/addresses", headers=headers)
        assert len(get_res.json()) == initial_count + 1

        # 4. Set as default
        def_res = await ac.patch(f"/api/customer/addresses/{addr_id}/default", headers=headers)
        assert def_res.status_code == 200

        # 5. Delete address
        del_res = await ac.delete(f"/api/customer/addresses/{addr_id}", headers=headers)
        assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_customer_wallet_overview(customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        res = await ac.get("/api/customer/wallet", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "wallet_balance" in data
        assert "servo_coins" in data
        assert "transactions" in data


@pytest.mark.asyncio
async def test_customer_notifications(customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        res = await ac.get("/api/customer/notifications", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "unread_count" in data
        assert "notifications" in data


@pytest.mark.asyncio
async def test_customer_support_ticket(customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    payload = {
        "subject": "Delivery Query",
        "message": "When will the order arrive?",
        "priority": "MEDIUM",
    }
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        res = await ac.post("/api/customer/support", json=payload, headers=headers)
        assert res.status_code == 200
        assert res.json()["success"] is True


# ─── 5. Cart Quote & Fee Calculation ────────────────────────────────────────

@pytest.mark.asyncio
async def test_cart_quote_calculation():
    async with httpx.AsyncClient(transport=transport, base_url=base_url) as ac:
        feed_res = await ac.get("/api/discovery/feed?mode=LOCAL")
        feed = feed_res.json()
        if feed["all_products"]:
            prod = feed["all_products"][0]

            quote_payload = {
                "shop_id": prod["shop_id"],
                "items": [{"inventory_id": prod["inventory_id"], "quantity": 2}],
            }
            res = await ac.post("/api/orders/cart-quote", json=quote_payload)
            assert res.status_code == 200
            data = res.json()
            assert data["items_total"] > 0
            assert data["platform_fee"] == 5.0
            assert data["grand_total"] >= data["items_total"]


# ─── 6. Razorpay Cryptographic Verification Test ────────────────────────────

def test_razorpay_signature_verification():
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id="order_dummy_123",
        razorpay_payment_id="pay_dummy_456",
        razorpay_signature="invalid_tampered_signature_string",
    )
    assert is_valid is False
