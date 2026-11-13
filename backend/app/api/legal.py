from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/legal", tags=["Legal & Policies"])

POLICIES = {
    "company": {
        "platform_name": "ServoLocal",
        "legal_entity": "ServoLocal Technologies Private Limited",
        "headquarters": "Jaipur, Rajasthan, India",
        "support_email": "support@servolocal.in",
    },
    "privacy_policy": {
        "title": "Privacy Policy & Data Security",
        "highlights": [
            "We collect location data solely to find nearby neighborhood stores and calculate delivery routes.",
            "Customer phone numbers and email addresses are securely protected with OTP verification.",
            "We never sell or share user personal data with third-party advertising networks.",
            "Payment data is encrypted end-to-end via PCI-DSS compliant Razorpay integration.",
        ],
    },
    "terms_of_service": {
        "seller": {
            "title": "Merchant Store Terms & Commission Policy",
            "rules": [
                "Shops must list genuine, unexpired, and authentic goods matching listed MRPs.",
                "Platform commission is capped at 5% on completed orders.",
                "Merchants must prepare orders within the 10-15 minute threshold upon acceptance.",
            ],
        },
        "partner": {
            "title": "Delivery Partner Agreement & Earnings",
            "rules": [
                "Delivery partners receive transparent per-order payouts credited to their digital wallet.",
                "Riders must verify the 4-digit Delivery PIN before completing delivery handover.",
                "Safety and adherence to traffic rules are mandatory for all active riders.",
            ],
        },
        "customer": {
            "title": "Customer Terms of Service",
            "rules": [
                "Orders can be tracked in real-time until final doorstep delivery.",
                "Zero cancellation fees if cancelled prior to shop acceptance.",
                "ServoCoins can be redeemed for instant bill discounts at checkout.",
            ],
        },
    },
    "prepaid_wallet_dues_policy": {
        "title": "Wallet & Dues Policy",
        "description": "Transparent credit limits for active neighborhood stores.",
        "rules": [
            "Default dues limit of ₹500 is provided to active merchants.",
            "Accounts with outstanding dues beyond -₹200 are temporarily locked until settled.",
        ],
    },
    "refund_and_cancellation_policy": {
        "title": "Refund & Cancellation Policy",
        "rules": [
            "Instant refunds for cancelled prepaid orders processed back to original source or ServoLocal Wallet.",
            "Damaged, incorrect or expired items can be flagged for immediate replacement or full refund.",
        ],
    },
}


@router.get("/policies")
async def get_legal_policies():
    """
    Returns platform legal policies, privacy terms, and merchant rules.
    """
    return POLICIES


@router.get("/terms")
async def get_legal_terms(role: str = Query("seller")):
    """
    Returns role-specific terms of service.
    """
    role_clean = role.lower().strip()
    terms = POLICIES["terms_of_service"].get(role_clean, POLICIES["terms_of_service"]["customer"])
    return terms

