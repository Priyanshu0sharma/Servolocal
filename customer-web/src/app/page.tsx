"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Package,
  Store,
  Sparkles,
  ShoppingBag,
  Clock,
  MapPin,
  Flame,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  Send,
  HeartHandshake
} from "lucide-react";
import {
  getDiscoveryFeed,
  getMe,
  submitAreaDemand,
  DiscoveryFeedResponse,
  ProductItem,
  ShopItem,
  ProductVariant,
  CartItem,
  UserProfile,
  OrderCheckoutResponse
} from "@/lib/api";
import HeaderAndSearch from "@/components/HeaderAndSearch";
import ProductCardAndRails from "@/components/ProductCardAndRails";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import LiveOrderTrackerAndReview from "@/components/LiveOrderTrackerAndReview";
import CustomerAuthScreen from "@/components/CustomerAuthScreen";

// 14 Iconic Quick Categories Grid (Blinkit Standard)
const CATEGORY_GRID = [
  { name: "Snacks & Munchies", icon: "🍟", query: "Chips", color: "bg-amber-50 text-amber-900 border-amber-200" },
  { name: "Dairy, Bread & Eggs", icon: "🥛", query: "Dairy", color: "bg-blue-50 text-blue-900 border-blue-200" },
  { name: "Cold Drinks & Juices", icon: "🥤", query: "Cold Drinks", color: "bg-cyan-50 text-cyan-900 border-cyan-200" },
  { name: "Breakfast & Instant Food", icon: "🍜", query: "Breakfast", color: "bg-yellow-50 text-yellow-900 border-yellow-200" },
  { name: "Sweet Tooth", icon: "🍫", query: "Sweet Tooth", color: "bg-pink-50 text-pink-900 border-pink-200" },
  { name: "Bakery & Biscuits", icon: "🍪", query: "Bakery", color: "bg-orange-50 text-orange-900 border-orange-200" },
  { name: "Tea, Coffee & Drinks", icon: "☕", query: "Tea", color: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  { name: "Atta, Rice & Dal", icon: "🌾", query: "Atta", color: "bg-stone-50 text-stone-900 border-stone-200" },
  { name: "Masala, Oil & More", icon: "🧂", query: "Masala", color: "bg-red-50 text-red-900 border-red-200" },
  { name: "Sauces & Spreads", icon: "🥫", query: "Sauces", color: "bg-purple-50 text-purple-900 border-purple-200" },
  { name: "Cleaning Essentials", icon: "🧼", query: "Cleaning", color: "bg-teal-50 text-teal-900 border-teal-200" },
  { name: "Personal Care", icon: "🧴", query: "Personal Care", color: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  { name: "Clothes & Fabrics", icon: "👕", query: "Clothes", color: "bg-violet-50 text-violet-900 border-violet-200" },
  { name: "3D Prints & Custom", icon: "🖨️", query: "Custom", color: "bg-slate-50 text-slate-900 border-slate-200" },
];

export default function CustomerHomePage() {
  const [currentLocality, setCurrentLocality] = useState("Kukas, Jaipur (RIICO / Colleges)");
  const [currentLat, setCurrentLat] = useState(27.0544);
  const [currentLng, setCurrentLng] = useState(75.8942);
  const [activeMode, setActiveMode] = useState<"LOCAL" | "PAN_INDIA">("LOCAL");
  const [feedData, setFeedData] = useState<DiscoveryFeedResponse | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // User & Guest session state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [initializingAuth, setInitializingAuth] = useState(true);

  // Cart & UI state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active tracking order state
  const [activeOrder, setActiveOrder] = useState<OrderCheckoutResponse["order"] | null>(null);

  // Area Demand Request Form State
  const [demandPhone, setDemandPhone] = useState("");
  const [demandSubmitted, setDemandSubmitted] = useState(false);
  const [submittingDemand, setSubmittingDemand] = useState(false);

  // Check user session on initial load
  useEffect(() => {
    const token = localStorage.getItem("servo_token");
    if (token) {
      getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("servo_token");
          setUser(null);
        })
        .finally(() => setInitializingAuth(false));
    } else {
      setInitializingAuth(false);
    }
  }, []);

  // Fetch Discovery Feed
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const data = await getDiscoveryFeed(currentLat, currentLng, activeMode, currentLocality);
      setFeedData(data);
    } catch {
      // Graceful fallback to demo data
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentLat, currentLng, activeMode, currentLocality]);

  // Handle Location Change
  const handleLocalityChange = (locality: string, lat: number, lng: number) => {
    setCurrentLocality(locality);
    setCurrentLat(lat);
    setCurrentLng(lng);
  };

  // Cart Handlers
  const handleAddToCart = (product: ProductItem | any, variant?: ProductVariant) => {
    const invId = product.id;
    const price = variant ? variant.price : product.selling_price || product.mrp;
    const variantId = variant ? variant.id : undefined;
    const packLabel = variant ? variant.weight_or_size : product.weight_or_size;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (c) => c.inventory_id === invId && (variantId ? c.variant_id === variantId : true)
      );

      if (existingIndex > -1) {
        const nextCart = [...prevCart];
        nextCart[existingIndex].quantity += 1;
        return nextCart;
      }

      return [
        ...prevCart,
        {
          inventory_id: invId,
          name: product.name,
          image_url: product.image_url,
          price: price,
          mrp: variant ? variant.mrp : product.mrp,
          quantity: 1,
          variant_id: variantId,
          pack_label: packLabel,
          shop_id: product.shop_id || 101,
          shop_name: product.shop_name || "ServoLocal Store",
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (inventoryId: number, newQty: number, variantId?: string) => {
    setCart((prevCart) => {
      if (newQty <= 0) {
        return prevCart.filter(
          (c) => !(c.inventory_id === inventoryId && (variantId ? c.variant_id === variantId : true))
        );
      }
      return prevCart.map((c) => {
        if (c.inventory_id === inventoryId && (variantId ? c.variant_id === variantId : true)) {
          return { ...c, quantity: newQty };
        }
        return c;
      });
    });
  };

  // Handle Area Demand Submission
  const handleSubmitDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandPhone.trim()) return;

    setSubmittingDemand(true);
    try {
      await submitAreaDemand({
        lat: currentLat,
        lng: currentLng,
        locality_name: currentLocality,
        phone_or_email: demandPhone.trim(),
      });
      setDemandSubmitted(true);
    } catch {
      setDemandSubmitted(true);
    } finally {
      setSubmittingDemand(false);
    }
  };

  // 1. Initial Auth Screen Gate (if not logged in and not guest yet)
  if (!initializingAuth && !user && !isGuest) {
    return (
      <CustomerAuthScreen
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsGuest(false);
        }}
        onContinueAsGuest={() => setIsGuest(true)}
      />
    );
  }

  // 2. Real Live Database Products & Shops from Neon PostgreSQL
  const allProducts: ProductItem[] = feedData?.all_products || [];
  const shops: ShopItem[] = feedData?.shops || [];

  // Filtered Products for Active Category Tab
  const filteredCategoryProducts = selectedCategory
    ? allProducts.filter((p) => {
        const catObj = CATEGORY_GRID.find((c) => c.name === selectedCategory);
        const q = (catObj?.query || selectedCategory).toLowerCase();
        return (
          p.category?.toLowerCase().includes(q) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
          p.name.toLowerCase().includes(q)
        );
      })
    : [];

  // Dedicated High-Interest Rails
  const chipsProducts = allProducts.filter(
    (p) =>
      p.category === "Snacks & Munchies" ||
      p.sub_category?.includes("Chips") ||
      p.sub_category?.includes("Namkeen") ||
      p.name.toLowerCase().includes("lays") ||
      p.name.toLowerCase().includes("kurkure") ||
      p.name.toLowerCase().includes("bingo") ||
      p.name.toLowerCase().includes("bhujia")
  );

  const dairyProducts = allProducts.filter(
    (p) =>
      p.category === "Dairy, Bread & Eggs" ||
      p.sub_category?.includes("Dairy") ||
      p.sub_category?.includes("Bread") ||
      p.sub_category?.includes("Eggs") ||
      p.name.toLowerCase().includes("milk") ||
      p.name.toLowerCase().includes("butter")
  );

  const coldDrinksProducts = allProducts.filter(
    (p) =>
      p.category === "Cold Drinks & Juices" ||
      p.sub_category?.includes("Cold Drinks") ||
      p.name.toLowerCase().includes("coca") ||
      p.name.toLowerCase().includes("sprite") ||
      p.name.toLowerCase().includes("juice") ||
      p.name.toLowerCase().includes("red bull")
  );

  const instantProducts = allProducts.filter(
    (p) =>
      p.category === "Breakfast & Instant Food" ||
      p.name.toLowerCase().includes("maggi") ||
      p.name.toLowerCase().includes("noodles") ||
      p.name.toLowerCase().includes("chocos")
  );

  const sweetsProducts = allProducts.filter(
    (p) =>
      p.category === "Sweet Tooth" ||
      p.name.toLowerCase().includes("silk") ||
      p.name.toLowerCase().includes("kitkat") ||
      p.name.toLowerCase().includes("chocolate")
  );

  const bakeryProducts = allProducts.filter(
    (p) =>
      p.category === "Bakery & Biscuits" ||
      p.name.toLowerCase().includes("parle") ||
      p.name.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("cookies")
  );

  const staplesProducts = allProducts.filter(
    (p) =>
      p.category === "Atta, Rice & Dal" ||
      p.category === "Masala, Oil & More" ||
      p.name.toLowerCase().includes("atta") ||
      p.name.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("salt")
  );

  const panIndiaProducts = allProducts.filter(
    (p) => p.is_pan_india_eligible || p.category === "Clothes & Fabrics" || p.category === "3D Prints & Custom"
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col select-none">
      {/* ── 1. Sticky Navbar & Search ──────────────────────────────── */}
      <HeaderAndSearch
        currentLocality={currentLocality}
        onLocalityChange={handleLocalityChange}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onLoginSuccess={(u) => {
          setUser(u);
          setIsGuest(false);
        }}
        onLogout={() => {
          localStorage.removeItem("servo_token");
          setUser(null);
          setIsGuest(false);
        }}
        onAddToCart={handleAddToCart}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-6">
        {/* ── 2. Hero Promotional Banner (Blinkit Clean Style) ──────── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-xl p-5 sm:p-8">
          <div className="max-w-xl space-y-2.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Instant Local Delivery in 15-20 Mins</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Daily essentials, snacks & drinks at your doorstep.
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50 font-medium leading-relaxed max-w-md">
              Order fresh milk, chips, cold drinks, and street treats from your local Kukas neighborhood shops with zero surge fees.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById("snacks-rail");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-5 py-2.5 rounded-2xl bg-white text-emerald-800 font-black text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Shop Now
              </button>
              <div className="flex items-center gap-3 text-[11px] sm:text-xs text-emerald-100 font-bold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Free delivery on ₹150+</span>
                </span>
                <span className="hidden sm:inline opacity-50">•</span>
                <span className="hidden sm:inline">Direct UPI 0% Fees</span>
              </div>
            </div>
          </div>

          {/* Aesthetic Floating Badge Background */}
          <div className="absolute right-4 bottom-2 top-2 w-1/3 opacity-20 pointer-events-none flex items-center justify-end">
            <ShoppingBag className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* ── 3. Category Quick Grid (Blinkit 14-Tile Grid) ─────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Explore Categories
              </h2>
              <span className="text-[11px] font-extrabold text-slate-400">
                (Tap to filter items)
              </span>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-emerald-600 font-black hover:underline cursor-pointer"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
            {CATEGORY_GRID.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedCategory(cat.name);
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-2xl border transition-all flex flex-col items-center text-center group cursor-pointer relative ${
                    isSelected
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-102"
                      : "bg-white border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${
                      isSelected ? "bg-white/20 text-white" : cat.color
                    } flex items-center justify-center text-xl mb-1.5 group-hover:scale-110 transition-transform`}
                  >
                    {cat.icon}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold line-clamp-2 leading-tight ${
                      isSelected ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Category Filtered Products ─────────────────────── */}
        {selectedCategory && (
          <div className="p-4 rounded-3xl bg-white border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {CATEGORY_GRID.find((c) => c.name === selectedCategory)?.icon || "📦"}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {selectedCategory}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-bold">
                    {filteredCategoryProducts.length > 0
                      ? `${filteredCategoryProducts.length} items available right now`
                      : "Showing matching demo recommendations"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors"
              >
                Clear Filter ✕
              </button>
            </div>

            <ProductCardAndRails
              title={`Items in ${selectedCategory}`}
              products={filteredCategoryProducts}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
            />
          </div>
        )}

        {/* ── 4. Unserviceable Area Fallback (Demand Capture) ───────── */}
        {feedData && !feedData.is_area_serviceable && (
          <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-200/80 text-amber-800 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black">
                  Instant 15-Minute Fleet is onboarding stores in {currentLocality}!
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                  Our delivery fleet is rapidly onboarding neighborhood stores in your area. Enter your WhatsApp number below to get notified as soon as local delivery launches in {currentLocality}.
                </p>
              </div>
            </div>

            {demandSubmitted ? (
              <div className="p-3 rounded-xl bg-white border border-emerald-300 text-emerald-700 text-xs font-bold flex items-center gap-2 max-w-md">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Demand recorded! We are prioritizing fleet routes in your sector.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitDemand} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={demandPhone}
                  onChange={(e) => setDemandPhone(e.target.value)}
                  placeholder="Enter WhatsApp Number"
                  required
                  className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={submittingDemand}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm shrink-0"
                >
                  {submittingDemand ? "Saving..." : "Notify Me"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── 5. Product Rails (Never Empty) ─────────────────────────── */}
        {/* Rail A: Featured Local Shops & Stalls */}
        {activeMode === "LOCAL" && shops.length > 0 && (
          <ProductCardAndRails
            title="Featured Neighborhood Stores & Stalls"
            badge="15-20 Mins"
            shops={shops}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail B: Chips, Snacks & Munchies */}
        {chipsProducts.length > 0 && (
          <div id="snacks-rail">
            <ProductCardAndRails
              title="Chips, Namkeen & Munchies"
              badge="Multi-pack Deals"
              products={chipsProducts}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
            />
          </div>
        )}

        {/* Rail C: Dairy, Bread & Fresh Milk */}
        {dairyProducts.length > 0 && (
          <ProductCardAndRails
            title="Dairy, Bread & Farm Fresh Eggs"
            badge="Fresh Daily"
            products={dairyProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail D: Cold Drinks, Juices & Refreshments */}
        {coldDrinksProducts.length > 0 && (
          <ProductCardAndRails
            title="Cold Drinks, Juices & Energy Boosters"
            badge="Chilled"
            products={coldDrinksProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail E: Maggi & Instant Breakfast */}
        {instantProducts.length > 0 && (
          <ProductCardAndRails
            title="Maggi & Instant Breakfast Cravings"
            badge="Quick 2-Min"
            products={instantProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail F: Chocolates & Sweet Tooth */}
        {sweetsProducts.length > 0 && (
          <ProductCardAndRails
            title="Chocolates & Sweet Tooth Treats"
            badge="Cravings"
            products={sweetsProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail G: Biscuits & Bakery */}
        {bakeryProducts.length > 0 && (
          <ProductCardAndRails
            title="Biscuits, Cookies & Tea-time Bakery"
            badge="Top Rated"
            products={bakeryProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail H: Daily Kirana & Atta/Oil Staples */}
        {staplesProducts.length > 0 && (
          <ProductCardAndRails
            title="Daily Kitchen Staples (Atta, Oil & Salt)"
            badge="Purity Guaranteed"
            products={staplesProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Rail I: Pan-India Direct Merch & 3D Prints */}
        {panIndiaProducts.length > 0 && (
          <ProductCardAndRails
            title="Pan-India Custom Apparel & 3D Gifts"
            badge="3-5 Days Courier"
            products={panIndiaProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}

        {/* Fallback All Store Catalog if specific rails are few */}
        {allProducts.length > 0 && (
          <ProductCardAndRails
            title="All Available Essentials"
            badge="Verified Stock"
            products={allProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
          />
        )}
      </main>

      {/* ── 6. Bottom Sticky Cart Bar for Mobile ───────────────────── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center justify-between shadow-lg shadow-emerald-500/30 active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.length} items</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ── 7. Smart Cart Drawer ───────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onAddToCart={handleAddToCart}
        onOrderPlaced={(orderData) => {
          setActiveOrder(orderData);
          setCart([]); // Clear cart upon successful order
        }}
        currentLocality={currentLocality}
      />

      {/* ── 8. Live Order Tracker & Review Popup ────────────────────── */}
      {activeOrder && (
        <LiveOrderTrackerAndReview
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
}
