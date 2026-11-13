import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? "https://servolocal-api.onrender.com"
    : "http://localhost:8001");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("servo_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: "customer" | "seller" | "partner" | "admin";
  wallet_balance: number;
  servo_coins: number;
  is_active: boolean;
}

export interface AdminOverviewData {
  total_users: number;
  total_customers: number;
  total_merchants: number;
  total_riders: number;
  total_shops: number;
  active_shops: number;
  total_orders: number;
  today_orders: number;
  total_gmv: number;
  today_gmv: number;
  platform_earnings: number;
  pending_shop_approvals: number;
}

export interface AdminShopItem {
  id: number;
  name: string;
  category: string;
  owner_name?: string;
  owner_email?: string;
  is_active: boolean;
  is_approved: boolean;
  rating: number;
  total_orders: number;
  created_at: string;
}

export async function sendAdminOtp(email: string) {
  const res = await api.post("/api/auth/send-otp", {
    email,
    role: "admin",
  });
  return res.data;
}

export async function verifyAdminOtp(email: string, otp_code: string) {
  const res = await api.post("/api/auth/verify-otp", {
    email,
    otp_code,
    role: "admin",
  });
  const data = res.data;
  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("servo_admin_token", data.access_token);
    localStorage.setItem("servo_admin_user", JSON.stringify(data.user));
  }
  return data;
}

export async function getAdminMe(): Promise<UserProfile> {
  const res = await api.get("/api/auth/me");
  return res.data;
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const res = await api.get("/api/admin/overview");
  return res.data;
}

export async function getAdminShops(): Promise<AdminShopItem[]> {
  const res = await api.get("/api/admin/shops");
  return res.data;
}

export async function approveShop(shopId: number, approve: boolean = true) {
  const res = await api.post(`/api/admin/shops/${shopId}/approve`, {
    is_approved: approve,
  });
  return res.data;
}

export async function updateCategoryCommission(category: string, commission_pct: number) {
  const res = await api.post("/api/admin/commissions", {
    category,
    commission_pct,
  });
  return res.data;
}

export async function checkBackendHealth() {
  const res = await api.get("/api/health");
  return res.data;
}

export interface AdminOrderItem {
  id: number;
  order_code: string;
  customer_id: number;
  shop_id: number;
  status: string;
  grand_total: number;
  delivery_pin?: string;
  pickup_pin?: string;
  delivery_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: Array<{
    item_name: string;
    weight_or_size?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  wallet_balance: number;
  servo_coins: number;
  is_active: boolean;
  created_at?: string;
}

export interface AdminCatalogItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  sub_category: string;
  default_weight_or_size: string;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  image_url: string;
  is_veg: boolean;
  description?: string;
  created_at?: string;
}

export interface AdminSettlementsData {
  total_gmv: number;
  platform_commission: number;
  partner_payouts_completed: number;
  recent_transactions: Array<{
    order_id: number;
    order_code: string;
    amount: number;
    commission: number;
    partner_earning: number;
    payment_method: string;
    payment_status: string;
    status: string;
    date?: string;
  }>;
}

export interface AdminAuditEvent {
  id: number;
  order_id: number;
  status: string;
  note?: string;
  timestamp?: string;
}

export async function getAdminOrders(): Promise<AdminOrderItem[]> {
  const res = await api.get("/api/admin/orders");
  return res.data;
}

export async function updateAdminOrderStatus(orderId: number, status: string) {
  const res = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
  return res.data;
}

export async function getAdminUsers(role?: string): Promise<AdminUserItem[]> {
  const res = await api.get("/api/admin/users", { params: role ? { role } : {} });
  return res.data;
}

export async function toggleUserActive(userId: number) {
  const res = await api.post(`/api/admin/users/${userId}/toggle-active`);
  return res.data;
}

export async function getAdminCatalog(q?: string): Promise<AdminCatalogItem[]> {
  const res = await api.get("/api/admin/catalog", { params: q ? { q } : {} });
  return res.data;
}

export async function createAdminCatalogItem(payload: any) {
  const res = await api.post("/api/admin/catalog", payload);
  return res.data;
}

export async function getAdminSettlements(): Promise<AdminSettlementsData> {
  const res = await api.get("/api/admin/settlements");
  return res.data;
}

export async function getAdminAudits(): Promise<AdminAuditEvent[]> {
  const res = await api.get("/api/admin/audits");
  return res.data;
}


