from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import (
    User,
    Address,
    WalletLedger,
    Notification,
    SupportTicket,
    WishlistItem,
    MasterCatalogItem,
    ShopInventory,
)
from app.api.auth import decode_token

router = APIRouter(prefix="/customer", tags=["Customer Portal"])


def get_current_customer(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in.",
        )
    token = authorization.split(" ")[1]
    return decode_token(token)


# ─── ADDRESSES ─────────────────────────────────────────────────────────────

class AddressCreatePayload(BaseModel):
    label: str = "Home"  # Home, Work, Other
    line1: str
    locality: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    lat: float = 27.0544
    lng: float = 75.8942
    is_default: bool = False


class AddressUpdatePayload(BaseModel):
    label: Optional[str] = None
    line1: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: Optional[bool] = None


@router.get("/addresses")
async def get_saved_addresses(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch customer's authenticated saved addresses from Neon PostgreSQL.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Address)
        .where(Address.user_id == user_id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    addresses = res.scalars().all()
    return [
        {
            "id": a.id,
            "label": a.label,
            "line1": a.line1,
            "locality": a.locality or "",
            "city": a.city or "",
            "pincode": a.pincode or "",
            "phone": a.phone or "",
            "lat": a.lat,
            "lng": a.lng,
            "is_default": a.is_default,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in addresses
    ]


@router.post("/addresses")
async def create_saved_address(
    payload: AddressCreatePayload,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Save a new delivery address for the authenticated customer.
    """
    user_id = user_payload.get("id")

    # If new address is marked as default, unset other defaults
    if payload.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )

    # Check if this is the user's first address
    count_res = await db.execute(select(Address).where(Address.user_id == user_id))
    has_existing = count_res.scalars().first() is not None
    is_default = payload.is_default or not has_existing

    new_addr = Address(
        user_id=user_id,
        label=payload.label.strip().capitalize() if payload.label else "Home",
        line1=payload.line1.strip(),
        locality=payload.locality.strip() if payload.locality else None,
        city=payload.city.strip() if payload.city else None,
        pincode=payload.pincode.strip() if payload.pincode else None,
        phone=payload.phone.strip() if payload.phone else None,
        lat=payload.lat,
        lng=payload.lng,
        is_default=is_default,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_addr)
    await db.commit()
    await db.refresh(new_addr)

    return {
        "success": True,
        "message": "Address saved successfully!",
        "address": {
            "id": new_addr.id,
            "label": new_addr.label,
            "line1": new_addr.line1,
            "locality": new_addr.locality,
            "city": new_addr.city,
            "pincode": new_addr.pincode,
            "phone": new_addr.phone,
            "lat": new_addr.lat,
            "lng": new_addr.lng,
            "is_default": new_addr.is_default,
        },
    }


@router.put("/addresses/{address_id}")
async def update_saved_address(
    address_id: int,
    payload: AddressUpdatePayload,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing address owned by the authenticated customer.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    addr = res.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found.")

    if payload.is_default is True:
        await db.execute(
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )
        addr.is_default = True

    if payload.label is not None:
        addr.label = payload.label.strip().capitalize()
    if payload.line1 is not None:
        addr.line1 = payload.line1.strip()
    if payload.locality is not None:
        addr.locality = payload.locality.strip()
    if payload.city is not None:
        addr.city = payload.city.strip()
    if payload.pincode is not None:
        addr.pincode = payload.pincode.strip()
    if payload.phone is not None:
        addr.phone = payload.phone.strip()
    if payload.lat is not None:
        addr.lat = payload.lat
    if payload.lng is not None:
        addr.lng = payload.lng

    await db.commit()
    await db.refresh(addr)
    return {"success": True, "message": "Address updated successfully!"}


@router.delete("/addresses/{address_id}")
async def delete_saved_address(
    address_id: int,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an address owned by the authenticated customer.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    addr = res.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found.")

    was_default = addr.is_default
    await db.delete(addr)
    await db.commit()

    # If deleted address was default, promote another address to default
    if was_default:
        next_addr_res = await db.execute(
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(Address.created_at.desc())
            .limit(1)
        )
        next_addr = next_addr_res.scalar_one_or_none()
        if next_addr:
            next_addr.is_default = True
            await db.commit()

    return {"success": True, "message": "Address deleted successfully!"}


@router.patch("/addresses/{address_id}/default")
async def set_default_address(
    address_id: int,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Sets the specified address as the primary default delivery address.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    addr = res.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found.")

    await db.execute(
        update(Address)
        .where(Address.user_id == user_id)
        .values(is_default=False)
    )
    addr.is_default = True
    await db.commit()

    return {"success": True, "message": "Default address updated!"}


# ─── WALLET & REWARDS ──────────────────────────────────────────────────────

@router.get("/wallet")
async def get_wallet_overview(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch customer's authenticated wallet balance, ServoCoins, and transaction ledger.
    """
    user_id = user_payload.get("id")
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    ledger_res = await db.execute(
        select(WalletLedger)
        .where(WalletLedger.user_id == user_id)
        .order_by(WalletLedger.created_at.desc())
        .limit(30)
    )
    ledgers = ledger_res.scalars().all()

    bal = round(user.wallet_balance or 0.0, 2)
    return {
        "wallet_balance": bal,
        "servo_coins": int(bal),
        "coin_value_rupees": bal,  # 1 Coin = ₹1 Rs
        "dues_limit": user.dues_limit or 500.0,
        "is_locked": (user.wallet_balance or 0.0) < -200.0,
        "transactions": [
            {
                "id": l.id,
                "entry_type": l.entry_type,
                "amount": l.amount,
                "balance_after": l.balance_after,
                "note": l.note or "",
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in ledgers
        ],
    }


# ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch notifications for the authenticated user from Neon DB.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    items = res.scalars().all()
    unread_count = sum(1 for i in items if not i.is_read)

    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "link_url": n.link_url,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ],
    }


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a single notification as read.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    n = res.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"success": True}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all unread notifications as read.
    """
    user_id = user_payload.get("id")
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"success": True, "message": "All notifications marked as read."}


# ─── WISHLIST ──────────────────────────────────────────────────────────────

@router.get("/wishlist")
async def get_wishlist(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch customer's authenticated saved wishlist items.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
    )
    items = res.scalars().all()
    product_ids = [i.product_id for i in items]

    if not product_ids:
        return {"items": []}

    # Fetch corresponding product details from master catalog or shop inventory
    products_res = await db.execute(
        select(MasterCatalogItem).where(MasterCatalogItem.id.in_(product_ids))
    )
    products = products_res.scalars().all()
    p_map = {p.id: p for p in products}

    return {
        "items": [
            {
                "wishlist_id": item.id,
                "product_id": item.product_id,
                "name": p_map[item.product_id].name if item.product_id in p_map else "Product",
                "category": p_map[item.product_id].category if item.product_id in p_map else "Grocery",
                "image_url": p_map[item.product_id].image_url if item.product_id in p_map else "",
                "mrp": p_map[item.product_id].mrp if item.product_id in p_map else 0.0,
                "selling_price": p_map[item.product_id].selling_price or p_map[item.product_id].mrp if item.product_id in p_map else 0.0,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in items
            if item.product_id in p_map
        ]
    }


class WishlistTogglePayload(BaseModel):
    product_id: int


@router.post("/wishlist/toggle")
async def toggle_wishlist_item(
    payload: WishlistTogglePayload,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Add or remove a product from customer's wishlist.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == payload.product_id,
        )
    )
    existing = res.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"success": True, "action": "removed", "in_wishlist": False}
    else:
        new_item = WishlistItem(
            user_id=user_id,
            product_id=payload.product_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_item)
        await db.commit()
        return {"success": True, "action": "added", "in_wishlist": True}


# ─── SUPPORT TICKETS ───────────────────────────────────────────────────────

class SupportTicketCreatePayload(BaseModel):
    order_id: Optional[int] = None
    subject: str
    message: str
    priority: str = "MEDIUM"


@router.get("/support")
async def get_my_support_tickets(
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all support tickets submitted by the authenticated customer.
    """
    user_id = user_payload.get("id")
    res = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.user_id == user_id)
        .order_by(SupportTicket.created_at.desc())
    )
    tickets = res.scalars().all()
    return [
        {
            "id": t.id,
            "order_id": t.order_id,
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "priority": t.priority,
            "admin_response": t.admin_response,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tickets
    ]


@router.post("/support")
async def create_support_ticket(
    payload: SupportTicketCreatePayload,
    user_payload: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a real support / grievance ticket into PostgreSQL.
    """
    user_id = user_payload.get("id")
    now = datetime.now(timezone.utc)
    ticket = SupportTicket(
        user_id=user_id,
        order_id=payload.order_id,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        status="OPEN",
        priority=payload.priority.upper() if payload.priority else "MEDIUM",
        created_at=now,
        updated_at=now,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return {
        "success": True,
        "message": "Your support ticket has been submitted. Our team will review and respond shortly.",
        "ticket": {
            "id": ticket.id,
            "subject": ticket.subject,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat(),
        },
    }

