export interface ApiHealthResponse {
  status: string;
  service: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface ProductItem {
  id: number;
  name: string;
  brand?: string;
  category: string;
  sub_category?: string;
  selling_price: number;
  mrp: number;
  rating?: number;
  unit?: string;
  default_weight_or_size?: string;
  image_url: string;
  in_stock: boolean;
  available_stock?: number;
  shop_id?: number;
  shop_name?: string;
  local_eta_mins?: string;
  delivery_mode?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  img: string;
  bgColor: string;
  query: string;
}

export interface CartItem {
  inventory_id: number;
  name: string;
  image_url: string;
  price: number;
  mrp: number;
  quantity: number;
  unit?: string;
  shop_id?: number;
  shop_name?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  gender?: string;
  phone?: string;
  wallet_balance?: number;
  servo_coins?: number;
  upi_id?: string;
  created_at?: string;
  is_active?: boolean;
  is_verified?: boolean;
}
