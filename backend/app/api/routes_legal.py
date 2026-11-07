from typing import Dict, Any, Optional
from fastapi import APIRouter, Query, status

router = APIRouter(prefix="/api/legal", tags=["Legal & Compliance"])


# ── Shared Master Policy Definitions ────────────────────────────────────────

MASTER_PRIVACY_POLICY = {
    "title": "ServoLocal Privacy & Location Data Governance Policy",
    "last_updated": "2026-11-01",
    "version": "2.1-compliance",
    "data_controller": "ServoLocal Technologies Private Limited, Jaipur, Rajasthan, India",
    "highlights": [
        "Precise GPS location is collected strictly to identify nearby hyperlocal stores within a 3km radius and enable live turn-by-turn delivery tracking.",
        "Customer phone numbers and email addresses are cryptographically stored and used solely for secure 6-digit OTP logins and critical order alerts.",
        "ServoLocal does NOT store debit/credit card numbers or UPI MPINs. All payments are processed through RBI-licensed gateways (Razorpay) or direct NPCI UPI deep links.",
        "Customer, Seller, and Partner location data is NEVER sold, rented, or shared with third-party data brokers or marketing aggregators.",
        "Background location access for delivery partners is active ONLY during an assigned delivery trip to broadcast real-time rider coordinates to the customer."
    ],
    "retention_and_deletion": "Users can request full account and data deletion at any time via support@servolocal.in or through the profile settings.",
}

MASTER_COMPANY_INFO = {
    "platform_name": "ServoLocal",
    "legal_entity": "ServoLocal Technologies Private Limited",
    "headquarters": "Jaipur, Rajasthan, 302028, India",
    "support_email": "support@servolocal.in",
    "grievance_officer": "grievance@servolocal.in",
    "jurisdiction": "High Court of Judicature for Rajasthan at Jaipur Bench",
}

CUSTOMER_TERMS = {
    "title": "Customer Terms of Use & Order Service Agreement",
    "rules": [
        "ServoLocal operates a hybrid marketplace connecting consumers with verified neighborhood kirana stores, food stalls, and Pan-India direct artisans.",
        "Estimated delivery arrival times (e.g. 10-15 mins) are dynamic indicators calculated using real-time Haversine distance, vendor prep time, and rider traffic.",
        "Customers must provide accurate GPS coordinates and be present at the delivery location with their 4-digit Delivery PIN to receive their order.",
        "ServoCoins earned on eligible orders can be redeemed for delivery fee waivers or instant cart discounts according to promotional rules.",
        "Free delivery thresholds (e.g. ₹99) are set individually by participating neighborhood shops or platform campaigns."
    ]
}

SELLER_TERMS = {
    "title": "Merchant & Vendor Master Marketplace Terms",
    "rules": [
        "Merchants must maintain accurate selling prices, fresh perishable goods, and honest inventory stock levels.",
        "The 1-Tap Open/Close switch must be toggled to CLOSED if the physical store is shut to avoid unfulfilled orders and cancellation penalties.",
        "ServoLocal levies an agreed platform commission (typically 8% to 15%) on completed orders.",
        "Direct UPI payments from customers are routed directly to the merchant's linked UPI VPA with zero platform escrow delay."
    ]
}

PARTNER_TERMS = {
    "title": "Delivery Partner & Field Fleet Agreement",
    "rules": [
        "Partners are independent delivery contractors connecting neighborhood vendors to local customers.",
        "Partners must broadcast live GPS coordinates at 5-second intervals during active order delivery.",
        "Mandatory 2-Digit Pickup PIN verification at the merchant store and 4-Digit Delivery PIN verification at the customer doorstep prevent fraud and misdelivery.",
        "Field Scouting Royalty: Partners who onboard street stalls (e.g. Kachori/Momos thele) receive a ₹2.00 lifetime referral royalty on every completed order from that vendor.",
        "Runner Stall Mode: For non-app street stalls, the partner purchases items with cash and delivers to customer, receiving full trip reimbursement upon customer delivery confirmation.",
        "Partners must follow Indian Motor Vehicles Act safety laws and hold valid driving licenses and vehicle insurance."
    ]
}

REFUND_AND_CANCELLATION_POLICY = {
    "title": "Universal Refund & Cancellation Policy",
    "rules": [
        "Customer Cancellation Window: Orders can be cancelled free of charge within 3 minutes of placement, or before the shop accepts and starts preparing the items.",
        "Vendor Stock-Out Cancellation: If a shop rejects an order due to unavailable stock, 100% of the payment is instantly refunded to the original payment source (UPI/Card/Wallet).",
        "Quality & Tamper Disputes: Defective, stale, or incorrect items reported with photo proof within 2 hours of delivery will be investigated and refunded immediately.",
        "Pan-India Marketplace Returns: For courier-shipped Pan-India orders (3-5 days delivery), return or replacement requests are accepted within 3 days of delivery for damaged or incorrect goods.",
        "Refund Processing Time: Direct UPI refunds reflect in the customer's bank account within 15 minutes to 2 business hours; card refunds settle in 3-5 banking days."
    ]
}

PREPAID_WALLET_DUES_POLICY = {
    "title": "Seller & Partner Prepaid Wallet Dues Policy (-₹200 Cutoff Agreement)",
    "description": "Zero-tax risk direct customer UPI settlement model with automatic dues safety cutoff.",
    "rules": [
        "Zero-Tax Escrow Model: Customers pay merchants directly via UPI. ServoLocal does NOT hold customer sales funds in escrow, avoiding GST/TDS marketplace liability.",
        "Commission Debit: Platform commission (e.g. 10%) and platform fee (₹5) are debited from the Seller's ServoLocal prepaid wallet ledger upon order completion.",
        "Maximum Negative Dues Limit (-₹200.00): The Seller's and Partner's wallet is permitted to operate up to a negative dues limit of -₹200.00 to allow uninterrupted business during the day.",
        "Auto-Pause & Lockout Threshold: Once the wallet balance drops below -₹200.00, the shop is automatically hidden from the customer discovery feed and new orders are paused.",
        "Instant Reactivation: The vendor can instantly clear dues and unpause their store 24/7 using the 1-Tap 'Pay Dues via UPI' button in the ServoPartner app.",
        "Partner Wallet Settlements: Delivery fees and scouting royalties accumulate in the Partner Wallet and can be withdrawn directly to the partner's UPI VPA on demand."
    ]
}


# ── 1. GET /api/legal/policies (Full Master Legal Document) ─────────────────

@router.get("/policies", status_code=status.HTTP_200_OK)
async def get_all_legal_policies() -> Dict[str, Any]:
    """
    Returns complete structured legal policies required for:
    - Razorpay Payment Gateway Merchant KYC
    - Google Play Store & Apple App Store App Review
    - Consumer Protection (E-Commerce) Rules, 2020 compliance
    """
    return {
        "success": True,
        "company": MASTER_COMPANY_INFO,
        "privacy_policy": MASTER_PRIVACY_POLICY,
        "terms_of_service": {
            "customer": CUSTOMER_TERMS,
            "seller": SELLER_TERMS,
            "partner": PARTNER_TERMS,
        },
        "refund_and_cancellation_policy": REFUND_AND_CANCELLATION_POLICY,
        "prepaid_wallet_dues_policy": PREPAID_WALLET_DUES_POLICY,
    }


# ── 2. GET /api/legal/terms (Role-filtered terms for in-app modals) ──────────

@router.get("/terms", status_code=status.HTTP_200_OK)
async def get_legal_terms(
    role: str = Query("customer", description="'customer', 'seller', or 'partner'")
) -> Dict[str, Any]:
    """
    Returns role-filtered terms and agreements for quick in-app acceptance dialogs.
    """
    clean_role = role.lower().strip()

    if clean_role == "seller":
        return {
            "role": "seller",
            "company": MASTER_COMPANY_INFO,
            "privacy_policy": MASTER_PRIVACY_POLICY,
            "terms_and_conditions": SELLER_TERMS,
            "prepaid_wallet_dues_policy": PREPAID_WALLET_DUES_POLICY,
            "refund_and_dispute_policy": REFUND_AND_CANCELLATION_POLICY,
        }
    elif clean_role == "partner":
        return {
            "role": "partner",
            "company": MASTER_COMPANY_INFO,
            "privacy_policy": MASTER_PRIVACY_POLICY,
            "terms_and_conditions": PARTNER_TERMS,
            "earnings_and_royalty_policy": PARTNER_TERMS,
            "prepaid_wallet_dues_policy": PREPAID_WALLET_DUES_POLICY,
        }
    else:
        return {
            "role": "customer",
            "company": MASTER_COMPANY_INFO,
            "privacy_policy": MASTER_PRIVACY_POLICY,
            "terms_and_conditions": CUSTOMER_TERMS,
            "refund_and_cancellation_policy": REFUND_AND_CANCELLATION_POLICY,
        }
