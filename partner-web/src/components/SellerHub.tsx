"use client";

import SellerDashboard from "./SellerDashboard";
import { UserProfile } from "@/lib/api";

interface SellerHubProps {
  user: UserProfile;
  onLogout: () => void;
}

/**
 * SellerHub: Complete Shopkeeper Hub for ServoLocal
 * Features:
 * - Shop Setup & Blinkit Free-Delivery Config (POST /api/seller/shop-setup)
 * - 1-Click Master Catalog Browser (POST /api/seller/inventory/add-from-master)
 * - "+ Not Listed" Custom Item Upload directly to Cloudflare R2 (POST /api/seller/inventory/add-custom)
 * - Live Stock & Demand Dashboard with pulsing "⚠️ LOW STOCK ALERT" (GET /api/seller/inventory)
 * - Incoming Order Ring & 2-Digit Pickup PIN Display with Loud Buzzer
 * - Prepaid Dues Wallet Card & Razorpay Recharge (POST /api/orders/clear-dues)
 * - Multi-Village Neighboring Route Delivery Management
 */
export default function SellerHub({ user, onLogout }: SellerHubProps) {
  return <SellerDashboard user={user} onLogout={onLogout} />;
}
