import { ApiHealthResponse, UserProfile } from "@/types";

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? "https://servolocal-api.onrender.com"
    : "http://localhost:8001");

/**
 * Fetch health status from the backend API.
 */
export async function checkBackendHealth(): Promise<ApiHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Authentication
 */
export async function sendOtp(email: string, role: string = "customer") {
  const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send OTP to email");
  }
  return res.json();
}

export async function verifyOtp(email: string, otp_code: string, role: string = "customer") {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid OTP code");
  }
  const data = await res.json();
  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("servo_token", data.access_token);
    localStorage.setItem("servo_user", JSON.stringify(data.user));
  }
  return data;
}

export async function updateUserProfile(name: string, gender?: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name, gender }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile");
  }
  const data = await res.json();
  if (typeof window !== "undefined" && data.user) {
    const saved = localStorage.getItem("servo_user");
    const existing = saved ? JSON.parse(saved) : {};
    const updated = { ...existing, ...data.user, gender: gender || existing.gender };
    localStorage.setItem("servo_user", JSON.stringify(updated));
    return updated;
  }
  return data;
}

export async function loginWithPassword(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid email or password");
  }
  const data = await res.json();
  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("servo_token", data.access_token);
    localStorage.setItem("servo_user", JSON.stringify(data.user));
  }
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

/**
 * Discovery Feed & Search
 */
export async function getDiscoveryFeed(
  lat: number = 27.0544,
  lng: number = 75.8942,
  mode: string = "LOCAL",
  locality: string = "Kukas, Jaipur"
) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    mode,
    locality,
  });
  const res = await fetch(`${API_BASE_URL}/api/discovery/feed?${params.toString()}`);
  if (!res.ok) throw new Error("Feed error");
  return res.json();
}

export async function searchSuggest(query: string) {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_BASE_URL}/api/discovery/search-suggest?${params.toString()}`);
  if (!res.ok) throw new Error("Search error");
  return res.json();
}

export async function getProductDetails(productId: number) {
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  if (!res.ok) throw new Error("Product fetch error");
  return res.json();
}

export async function getProductOffers(productId: number, lat?: number, lng?: number, mode?: string) {
  const params = new URLSearchParams();
  if (lat) params.set("lat", lat.toString());
  if (lng) params.set("lng", lng.toString());
  if (mode) params.set("mode", mode);
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}/offers?${params.toString()}`);
  if (!res.ok) throw new Error("Offers fetch error");
  return res.json();
}

/**
 * Orders & Checkout
 */
export async function getCartQuote(
  shopId: number,
  items: Array<{ inventory_id: number; quantity: number }>,
  couponCode?: string
) {
  const res = await fetch(`${API_BASE_URL}/api/orders/cart-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shop_id: shopId,
      items,
      coupon_code: couponCode,
    }),
  });
  if (!res.ok) throw new Error("Quote error");
  return res.json();
}

export async function checkoutOrder(payload: {
  shop_id: number;
  items: Array<{ inventory_id: number; quantity: number }>;
  delivery_address: string;
  payment_method: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Checkout error");
  return res.json();
}

export async function getMyOrders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Orders error");
  return res.json();
}

export async function trackOrder(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/api/orders/track/${orderId}`);
  if (!res.ok) throw new Error("Tracking error");
  return res.json();
}

/**
 * Admin Portal Endpoints
 */
export async function getAdminStats() {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Admin stats error");
  return res.json();
}

export async function getAdminOrders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Admin orders error");
  return res.json();
}

export async function updateAdminOrderStatus(orderId: number, status: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("servo_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Status update error");
  return res.json();
}

/**
 * Razorpay Payment Gateway APIs
 */
export async function createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>) {
  const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, receipt, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create payment order");
  }
  return res.json();
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Payment verification failed");
  }
  return res.json();
}

/**
 * Cloudflare R2 Image Storage APIs
 */
export async function uploadImageToR2(file: File, folder: string = "products") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch(`${API_BASE_URL}/api/storage/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload image to R2");
  }
  return res.json();
}

export async function getR2PresignedUrl(filename: string, contentType: string = "image/jpeg", folder: string = "products") {
  const res = await fetch(`${API_BASE_URL}/api/storage/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content_type: contentType, folder }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate presigned upload URL");
  }
  return res.json();
}
