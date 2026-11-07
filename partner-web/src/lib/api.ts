import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatic Bearer Token Interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("servo_partner_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── TypeScript Types ────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: "customer" | "seller" | "partner" | "admin";
  wallet_balance: number;
  dues_limit: number;
  servo_coins: number;
  upi_id?: string;
  fcm_token?: string;
  is_active: boolean;
  terms_accepted: boolean;
  location_permission_granted: boolean;
}

export interface AppConfig {
  latest_version: string;
  min_required_version: string;
  force_update: boolean;
  update_message: string;
  playstore_url: string;
  maintenance_mode: boolean;
  maintenance_message?: string;
  banners: Array<{
    id: number;
    title: string;
    image_url: string;
    target_route: string;
    badge_text?: string;
  }>;
}

export interface LegalPolicies {
  company: {
    platform_name: string;
    legal_entity: string;
    headquarters: string;
    support_email: string;
  };
  privacy_policy: {
    title: string;
    highlights: string[];
  };
  terms_of_service: {
    seller: { title: string; rules: string[] };
    partner: { title: string; rules: string[] };
    customer: { title: string; rules: string[] };
  };
  prepaid_wallet_dues_policy: {
    title: string;
    description: string;
    rules: string[];
  };
  refund_and_cancellation_policy: {
    title: string;
    rules: string[];
  };
}

export interface ShopData {
  id: number;
  name: string;
  category: string;
  image_url?: string;
  is_open: boolean;
  is_verified?: boolean;
  rating?: number;
  management_mode: string;
  locality_name: string;
  lat: number;
  lng: number;
  delivery_radius_km: number;
  delivery_scope: "LOCAL_ONLY" | "PAN_INDIA" | "BOTH";
  free_delivery_enabled: boolean;
  min_order_for_free_delivery: number;
  base_delivery_fee: number;
  seller_upi_id?: string;
  custom_serviceable_areas?: Array<{ area_name: string; eta_label: string; delivery_fee: number }>;
}

export interface ShopSetupPayload {
  name: string;
  category: string;
  image_url?: string;
  is_open: boolean;
  management_mode?: "SELLER_MANAGED" | "PARTNER_RUNNER_STALL";
  lat: number;
  lng: number;
  locality_name: string;
  delivery_scope: "LOCAL_ONLY" | "PAN_INDIA" | "BOTH";
  delivery_radius_km: number;
  free_delivery_enabled: boolean;
  min_order_for_free_delivery: number;
  base_delivery_fee: number;
  seller_upi_id?: string;
  custom_serviceable_areas?: Array<{ area_name: string; eta_label: string; delivery_fee: number }>;
}

export interface ProductVariant {
  id: string;
  weight_or_size: string;
  unit_count: number;
  mrp: number;
  price: number;
  discount_pct: number;
  is_default: boolean;
}

export interface MasterCatalogItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  sub_category?: string;
  default_weight_or_size?: string;
  mrp: number;
  image_url: string;
  gallery_images?: string[];
  variants?: ProductVariant[];
  is_veg?: boolean;
  search_keywords?: string;
  paired_sub_categories?: string[];
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  sub_category?: string;
  selling_price: number;
  mrp: number;
  weight_or_size?: string;
  available_stock: number;
  total_stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  in_stock: boolean;
  is_not_listed_custom: boolean;
  is_pan_india_eligible: boolean;
  variants?: ProductVariant[];
  is_veg?: boolean;
  image_url: string;
}

export interface AddCustomItemPayload {
  name: string;
  category: string;
  sub_category?: string;
  selling_price: number;
  mrp: number;
  weight_or_size: string;
  image_url?: string;
  image_base64?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_pan_india_eligible?: boolean;
}

export interface OrderItem {
  id: number;
  item_name: string;
  weight_or_size?: string;
  variant_id?: string;
  selected_pack_label?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
}

export interface SellerOrder {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  payment_method: string;
  payment_status: string;
  items_total: number;
  delivery_fee: number;
  platform_fee: number;
  grand_total: number;
  created_at: string;
  pickup_pin: string;
  items: OrderItem[];
}

// ── API Functions ──────────────────────────────────────────────────────────

// Auth Endpoints
export async function sendOtp(email: string, role: string) {
  const res = await api.post("/api/auth/send-otp", { email, role });
  return res.data;
}

export async function verifyOtp(email: string, otp_code: string, role: string) {
  const res = await api.post("/api/auth/verify-otp", { email, otp_code, role });
  if (res.data?.access_token) {
    localStorage.setItem("servo_partner_token", res.data.access_token);
    localStorage.setItem("servo_partner_role", res.data.user.role);
    localStorage.setItem("servo_partner_user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function googleLogin(id_token: string, role: string) {
  const res = await api.post("/api/auth/google", { id_token, role });
  if (res.data?.access_token) {
    localStorage.setItem("servo_partner_token", res.data.access_token);
    localStorage.setItem("servo_partner_role", res.data.user.role);
    localStorage.setItem("servo_partner_user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await api.get("/api/auth/me");
  return res.data;
}

export async function updatePermissions(params: {
  location_permission_granted?: boolean;
  terms_accepted?: boolean;
  fcm_token?: string;
}) {
  const res = await api.post("/api/auth/update-permission", params);
  return res.data;
}

export async function getAppConfig(): Promise<AppConfig> {
  const res = await api.get("/api/app-config");
  return res.data?.app_version
    ? { ...res.data.app_version, banners: res.data.banners || [] }
    : res.data;
}

export async function getLegalPolicies(): Promise<LegalPolicies> {
  const res = await api.get("/api/legal/policies");
  return res.data;
}

export async function getLegalTerms(role: string = "seller") {
  const res = await api.get(`/api/legal/terms?role=${role}`);
  return res.data;
}

// Seller Hub Endpoints
export async function setupShop(payload: ShopSetupPayload) {
  const res = await api.post("/api/seller/shop-setup", payload);
  return res.data;
}

export async function getMasterCatalog(search: string = "a"): Promise<MasterCatalogItem[]> {
  try {
    const res = await api.get(`/api/discovery/search-suggest?q=${encodeURIComponent(search || "a")}`);
    return res.data?.products || [];
  } catch {
    return [];
  }
}

export async function getShopInventory() {
  const res = await api.get("/api/seller/inventory");
  return res.data;
}

export async function addFromMasterCatalog(
  master_item_id: number,
  selling_price: number,
  stock_quantity: number = 50,
  is_pan_india_eligible: boolean = false
) {
  const res = await api.post("/api/seller/inventory/add-from-master", {
    master_item_id,
    selling_price,
    stock_quantity,
    is_pan_india_eligible,
  });
  return res.data;
}

export async function addCustomItem(payload: AddCustomItemPayload) {
  const res = await api.post("/api/seller/inventory/add-custom", payload);
  return res.data;
}

export async function getSellerOrders(): Promise<SellerOrder[]> {
  try {
    const res = await api.get("/api/seller/orders");
    return res.data?.orders || [];
  } catch {
    // If dedicated seller orders route is pending, return simulated live queue
    return [];
  }
}

export async function updateOrderStatus(order_id: number, status: string) {
  const res = await api.post(`/api/seller/orders/${order_id}/status`, { status });
  return res.data;
}

export async function toggleShopStatus(is_open?: boolean) {
  const res = await api.post("/api/seller/shop-toggle", { is_open });
  return res.data;
}

export async function verifyPickupPin(order_id: number, pickup_pin: string) {
  const res = await api.post("/api/partner/verify-pickup-pin", {
    order_id,
    pickup_pin,
  });
  return res.data;
}

// ── Delivery Partner & Rider Hub Endpoints ─────────────────────────────────

export interface OnboardShopFieldPayload {
  owner_name: string;
  owner_email: string;
  shop_name: string;
  category?: string;
  lat: number;
  lng: number;
  locality_name?: string;
  is_runner_stall?: boolean;
  delivery_radius_km?: number;
  image_url?: string;
  seller_upi_id?: string;
}

export async function updateRiderGps(order_id: number, lat: number, lng: number, heading: number = 0.0) {
  const res = await api.post("/api/partner/update-gps", {
    order_id,
    lat,
    lng,
    heading,
  });
  return res.data;
}

export async function verifyDeliveryPin(order_id: number, delivery_pin: string) {
  const res = await api.post("/api/partner/verify-delivery-pin", {
    order_id,
    delivery_pin,
  });
  return res.data;
}

export async function onboardShopField(payload: OnboardShopFieldPayload) {
  const res = await api.post("/api/partner/onboard-shop", payload);
  return res.data;
}

export async function toggleDutyStatus(is_on_duty: boolean, lat: number = 0.0, lng: number = 0.0) {
  const res = await api.post("/api/partner/duty-toggle", {
    is_on_duty,
    lat,
    lng,
  });
  return res.data;
}

export async function updateDutyGps(lat: number, lng: number) {
  const res = await api.post("/api/partner/duty-gps", { lat, lng });
  return res.data;
}

export async function getDutyStatus() {
  const res = await api.get("/api/partner/duty-status");
  return res.data;
}

export async function getActiveRiders() {
  const res = await api.get("/api/partner/active-riders");
  return res.data;
}

export async function getTrackOrder(order_id: number) {
  const res = await api.get(`/api/partner/track-order/${order_id}`);
  return res.data;
}

// ── Super Admin Founder Panel Endpoints ──────────────────────────────────

export interface AdminOverviewData {
  revenue: {
    total_gmv: number;
    platform_fees_earned: number;
    commissions_earned: number;
    net_revenue: number;
  };
  orders: {
    total_orders: number;
    active_orders: number;
    completed_orders: number;
    cancelled_orders: number;
  };
  shops: {
    total_registered: number;
    verified_count: number;
    pending_approval_count: number;
    open_now_count: number;
  };
  users: {
    total_customers: number;
    total_sellers: number;
    total_delivery_partners: number;
  };
  area_requests: {
    total_requests: number;
    recent_requests: Array<{
      id: number;
      locality_name: string;
      pincode?: string;
      phone_or_email: string;
      lat: number;
      lng: number;
      created_at?: string;
    }>;
  };
  dues_ledger: {
    total_dues_outstanding: number;
    auto_locked_accounts_count: number;
    dues_limit_threshold: number;
  };
}

export interface AdminShopItem {
  id: number;
  name: string;
  category: string;
  locality_name: string;
  management_mode: string;
  is_open: boolean;
  is_verified: boolean;
  rating: number;
  commission_rate_percent: number;
  delivery_radius_km: number;
  lat: number;
  lng: number;
  owner: {
    id: number;
    name: string;
    email: string;
    wallet_balance: number;
    is_locked: boolean;
  };
}

export interface AdminLedgerItem {
  id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  order_id?: number;
  transaction_type: string;
  amount: number;
  balance_after: number;
  notes?: string;
  created_at?: string;
}

export interface PushAppUpdatePayload {
  latest_version: string;
  min_required_version: string;
  force_update: boolean;
  update_message: string;
  playstore_url?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  broadcast_push?: boolean;
}

export interface PromoBannerPayload {
  title: string;
  image_url: string;
  target_route?: string;
  badge_text?: string;
  is_active?: boolean;
  display_order?: number;
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const res = await api.get("/api/admin/overview");
  return res.data;
}

export async function getAdminShops(): Promise<{ total_shops: number; shops: AdminShopItem[] }> {
  const res = await api.get("/api/admin/shops");
  return res.data;
}

export async function approveShop(shop_id: number, is_verified: boolean = true, commission_rate_percent?: number) {
  const res = await api.post(`/api/admin/shop/${shop_id}/approve`, {
    is_verified,
    commission_rate_percent,
  });
  return res.data;
}

export async function updateCategoryCommission(category: string, commission_rate_percent: number) {
  const res = await api.post("/api/admin/commission", {
    category,
    commission_rate_percent,
  });
  return res.data;
}

export async function getAdminLedger(limit: number = 50): Promise<{ total_records: number; ledger_entries: AdminLedgerItem[] }> {
  const res = await api.get(`/api/admin/ledger?limit=${limit}`);
  return res.data;
}

export async function pushAppUpdateAdmin(payload: PushAppUpdatePayload) {
  const res = await api.post("/api/admin/push-app-update", payload);
  return res.data;
}

export async function createPromoBanner(payload: PromoBannerPayload) {
  const res = await api.post("/api/admin/banners", payload);
  return res.data;
}

export async function getAdminCoupons() {
  const res = await api.get("/api/admin/coupons");
  return res.data?.coupons || [];
}

export async function createAdminCoupon(payload: {
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  is_active?: boolean;
}) {
  const res = await api.post("/api/admin/coupons", payload);
  return res.data;
}

// Wallet & Prepaid Dues Endpoints
export async function createClearDuesOrder(amount: number = 200) {
  // Directly credits ledger or initiates Razorpay recharge
  const res = await api.post("/api/orders/clear-dues", { amount });
  return res.data;
}

export async function verifyClearDuesPayment(params: {
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
}) {
  const res = await api.post("/api/orders/clear-dues", params);
  return res.data;
}

export default api;
