from typing import Dict, Any
from fastapi import APIRouter, Query, status

router = APIRouter(prefix="/api/legal", tags=["Legal & Compliance"])


@router.get("/terms", status_code=status.HTTP_200_OK)
async def get_legal_terms(
    role: str = Query("customer", description="'customer', 'seller', or 'partner'")
) -> Dict[str, Any]:
    """
    Returns structured legal policies, terms, refund rules, and wallet dues compliance.
    Required for Razorpay Payment Gateway KYC, Google Play Store, and Apple App Store compliance.
    """
    clean_role = role.lower().strip()

    base_privacy_policy = {
        "title": "Privacy & Location Data Policy",
        "last_updated": "2026-11-01",
        "highlights": [
            "Precise GPS location is collected exclusively to detect nearby verified local stores and enable real-time delivery tracking.",
            "Phone numbers and emails are encrypted and used solely for secure 6-digit OTP logins and order status alerts.",
            "ServoLocal does NOT store debit/credit card numbers or UPI MPINs. All payments are processed via RBI-licensed gateways (Razorpay) or direct UPI intent.",
            "User location is never sold to third-party data brokers."
        ]
    }

    base_company_info = {
        "platform_name": "ServoLocal",
        "entity": "ServoLocal Technologies Private Limited (Incorporated in India)",
        "support_email": "support@servolocal.in",
        "compliance_officer": "compliance@servolocal.in",
        "jurisdiction": "Jaipur, Rajasthan, India"
    }

    if clean_role == "seller":
        return {
            "role": "seller",
            "company": base_company_info,
            "privacy_policy": base_privacy_policy,
            "terms_and_conditions": {
                "title": "Seller & Vendor Master Terms of Service",
                "rules": [
                    "Merchants must maintain accurate pricing, fresh perishable goods, and honest inventory stock levels.",
                    "1-Tap Open/Close switch must be toggled to CLOSED if the physical store is shut to prevent customer cancellations.",
                    "ServoLocal levies an agreed platform commission (typically 8% to 15%) on completed orders.",
                    "Direct UPI payments from customers are routed directly to the merchant's linked VPA/UPI account."
                ]
            },
            "prepaid_wallet_dues_policy": {
                "title": "Prepaid Dues & Auto-Pause Threshold Policy (-₹200 Cutoff)",
                "rules": [
                    "Platform commission and ₹5 platform fees are debited from the Seller's ServoLocal prepaid wallet on completed orders.",
                    "When the Seller's wallet balance reaches or drops below -₹200.00 (Maximum Dues Limit), store orders are automatically paused.",
                    "To resume accepting customer orders, the Seller must settle the outstanding dues via the in-app UPI or Razorpay payment button.",
                    "Zero tax risk model: Customers pay sellers directly, and sellers settle only platform commission dues."
                ]
            },
            "refund_and_dispute_policy": {
                "title": "Merchant Refund & Cancellation Policy",
                "rules": [
                    "If an order cannot be prepared due to stock-out, the merchant must reject the order within 3 minutes for instant customer refund.",
                    "Defective, stale, or incorrect items reported by customers within 2 hours of delivery will be investigated and settled mutually."
                ]
            }
        }

    elif clean_role == "partner":
        return {
            "role": "partner",
            "company": base_company_info,
            "privacy_policy": base_privacy_policy,
            "terms_and_conditions": {
                "title": "Delivery Partner & Field Fleet Agreement",
                "rules": [
                    "Partners are independent service providers connecting neighborhood vendors to customers.",
                    "Partners must broadcast live GPS coordinates at 5-second intervals during active order fulfillment.",
                    "Mandatory 2-Digit Pickup PIN verification at the merchant store and 4-Digit Delivery PIN verification at the customer doorstep prevent fraud.",
                    "Partners must follow local traffic safety laws and maintain valid driving licenses and vehicle insurance."
                ]
            },
            "earnings_and_royalty_policy": {
                "title": "Delivery Earnings & Field-Scouting Lifetime Royalty",
                "rules": [
                    "Partners receive 100% of the customer delivery fee for completed deliveries.",
                    "Field Scouting Royalty: Partners who onboard street stalls (e.g. Kachori/Momos thele) receive a ₹2.00 lifetime referral royalty on every completed order from that vendor.",
                    "Runner Stall Mode: For non-app stalls, the partner purchases items with cash and delivers to customer, receiving full trip reimbursement."
                ]
            },
            "prepaid_wallet_dues_policy": {
                "title": "Partner Wallet Settlement Policy",
                "rules": [
                    "Delivery fees and royalties accumulate in the Partner Wallet and can be withdrawn to bank/UPI on weekly cycles.",
                    "Cash collected from COD orders must be settled within 24 hours to avoid wallet debit lockouts."
                ]
            }
        }

    else:
        # Customer Terms
        return {
            "role": "customer",
            "company": base_company_info,
            "privacy_policy": base_privacy_policy,
            "terms_and_conditions": {
                "title": "Customer Terms of Use",
                "rules": [
                    "ServoLocal connects consumers to verified local neighborhood stores and Pan-India artisans.",
                    "Estimated delivery times (e.g. 15-20 mins) are dynamic indicators based on distance, traffic, and vendor preparation speed.",
                    "Customers must provide accurate GPS coordinates and be available at the delivery location with the 4-digit Delivery PIN.",
                    "ServoCoins earned on eligible orders can be redeemed for delivery fee waivers or cart discounts."
                ]
            },
            "refund_and_cancellation_policy": {
                "title": "Customer Refund & Cancellation Policy",
                "rules": [
                    "Orders can be cancelled free of charge before the shop accepts and begins preparing the items.",
                    "In the event of an unserviceable delivery attempt or vendor rejection, full 100% refund is initiated immediately to original payment source (UPI/Card).",
                    "For Pan-India orders (3-5 days delivery), returns are accepted within 3 days of delivery for damaged or incorrect apparel/custom items."
                ]
            }
        }
