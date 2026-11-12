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

