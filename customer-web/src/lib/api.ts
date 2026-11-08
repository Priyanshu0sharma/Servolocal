import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://servolocal-api.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("servo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── TypeScript Interfaces ──────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: "customer" | "seller" | "partner" | "admin";
  servo_coins: number;
  wallet_balance: number;
  fcm_token?: string;
  terms_accepted: boolean;
  location_permission_granted: boolean;
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

export interface ProductItem {
  id: number;
  shop_id: number | null;
  shop_name?: string | null;
  shop_locality?: string | null;
  shop_is_open?: boolean;
  master_item_id?: number | null;
  is_not_listed_custom?: boolean;
  name: string;
  brand?: string;
  category: string;
  sub_category?: string | null;
  image_url: string;
  gallery_images?: string[];
  variants?: ProductVariant[];
  is_veg?: boolean;
  weight_or_size?: string;
  default_weight_or_size?: string;
  selling_price: number;
  mrp: number;
  discount_percent?: number;
  available_stock: number;
  in_stock: boolean;
  is_pan_india_eligible: boolean;
  local_eta_mins?: string;
  estimated_delivery?: string;
}

export interface ShopItem {
  id: number;
  name: string;
  category: string;
  image_url?: string;
  is_open: boolean;
  rating: number;
  management_mode: string;
  locality_name: string;
  delivery_scope: "LOCAL_ONLY" | "PAN_INDIA" | "BOTH";
  delivery_radius_km: number;
  distance_km: number;
  local_eta_mins: string;
  national_eta_days?: string;
  custom_serviceable_areas?: Array<{ area_name: string; eta_label: string; delivery_fee: number }>;
  is_scheduled_route?: boolean;
  scheduled_area_name?: string;
  scheduled_eta?: string;
  free_delivery_enabled: boolean;
  min_order_for_free_delivery: number;
  base_delivery_fee: number;
  is_verified?: boolean;
}

export interface DiscoveryFeedResponse {
  mode: "LOCAL" | "PAN_INDIA";
  is_area_serviceable: boolean;
  user_locality?: string;
  banner_badge?: string;
  message?: string;
  has_scheduled_routes?: boolean;
  shops?: ShopItem[];
  scheduled_route_shops?: ShopItem[];
  all_products?: ProductItem[];
  rails?: {
    featured_shops?: ShopItem[];
    kirana_rail?: ProductItem[];
    fast_food_rail?: ProductItem[];
    street_stalls_rail?: ProductItem[];
    scheduled_route_rail?: ShopItem[];
    clothes_rail?: ProductItem[];
    custom_3d_rail?: ProductItem[];
  };
}

export interface CartItem {
  inventory_id: number;
  name: string;
  image_url: string;
  price: number;
  mrp: number;
  quantity: number;
  variant_id?: string;
  pack_label?: string;
  shop_id: number;
  shop_name?: string;
}

export interface CartQuoteResponse {
  shop_id: number;
  shop_name: string;
  items_total: number;
  delivery_fee: number;
  platform_fee: number;
  discount_amount?: number;
  coupon_code?: string;
  coupon_applied?: boolean;
  coupon_message?: string;
  grand_total: number;
  free_delivery_threshold: number;
  amount_needed_for_free_delivery: number;
  free_delivery_unlocked: boolean;
  progress_percent: number;
  smart_upsells: Array<{
    id: number;
    name: string;
    price: number;
    mrp: number;
    image_url: string;
    weight_or_size?: string;
  }>;
}

export interface OrderCheckoutResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    order_code: string;
    status: string;
    grand_total: number;
    pickup_pin: string;
    delivery_pin: string;
    payment_method: string;
    razorpay_order_id?: string;
    upi_intent_link?: string;
    shop_name: string;
    shop_locality: string;
  };
}

export interface OrderReviewPayload {
  order_id: number;
  shop_rating: number;
  partner_rating?: number;
  comment?: string;
}

export interface AreaDemandPayload {
  lat: number;
  lng: number;
  locality_name?: string;
  pincode?: string;
  phone_or_email: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

export async function getDiscoveryFeed(
  lat: number = 27.0544,
  lng: number = 75.8942,
  mode: "LOCAL" | "PAN_INDIA" = "LOCAL",
  locality?: string
): Promise<DiscoveryFeedResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    mode,
  });
  if (locality) params.append("locality", locality);

  const res = await api.get(`/api/discovery/feed?${params.toString()}`);
  return res.data;
}

export async function searchSuggest(query: string, lat?: number, lng?: number) {
  const params = new URLSearchParams({ q: query });
  if (lat) params.append("lat", lat.toString());
  if (lng) params.append("lng", lng.toString());

  const res = await api.get(`/api/discovery/search-suggest?${params.toString()}`);
  return res.data;
}

export async function submitAreaDemand(payload: AreaDemandPayload) {
  const res = await api.post("/api/discovery/area-demand", payload);
  return res.data;
}

export async function getCartQuote(
  shop_id: number,
  items: Array<{ inventory_id: number; quantity: number; variant_id?: string; pack_label?: string }>,
  delivery_lat: number = 27.0544,
  delivery_lng: number = 75.8942,
  coupon_code?: string
): Promise<CartQuoteResponse> {
  const res = await api.post("/api/orders/cart-quote", {
    shop_id,
    items,
    delivery_lat,
    delivery_lng,
    coupon_code,
  });
  return res.data;
}

export async function checkoutOrder(payload: {
  shop_id: number;
  items: Array<{ inventory_id: number; quantity: number; variant_id?: string; pack_label?: string }>;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  payment_method: string;
  customer_notes?: string;
  coupon_code?: string;
}): Promise<OrderCheckoutResponse> {
  const res = await api.post("/api/orders/checkout", payload);
  return res.data;
}

export async function submitOrderReview(payload: OrderReviewPayload) {
  const res = await api.post("/api/orders/review", payload);
  return res.data;
}

export async function trackOrderRest(order_id: number) {
  const res = await api.get(`/api/partner/track-order/${order_id}`);
  return res.data;
}

// ── Auth Endpoints ─────────────────────────────────────────────────────────

export async function sendOtp(email: string, role: string = "customer") {
  const res = await api.post("/api/auth/send-otp", { email, role });
  return res.data;
}

export async function verifyOtp(email: string, otp_code: string, role: string = "customer") {
  const res = await api.post("/api/auth/verify-otp", { email, otp_code, role });
  if (res.data?.access_token) {
    localStorage.setItem("servo_token", res.data.access_token);
    localStorage.setItem("servo_user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function googleLogin(id_token: string, role: string = "customer") {
  const res = await api.post("/api/auth/google", { id_token, role });
  if (res.data?.access_token) {
    localStorage.setItem("servo_token", res.data.access_token);
    localStorage.setItem("servo_user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await api.get("/api/auth/me");
  return res.data;
}

export default api;
