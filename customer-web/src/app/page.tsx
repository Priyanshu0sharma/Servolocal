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
  Send
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
import BlinkitUnserviceableState from "@/components/BlinkitUnserviceableState";

// 14 Iconic Quick Categories Grid (Blinkit Standard with Real Thumbnail Clusters)
const CATEGORY_GRID = [
  {
    name: "Dairy, Bread & Eggs",
    img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80",
    query: "Dairy",
    bg: "bg-blue-50/60",
  },
  {
    name: "Snacks & Munchies",
    img: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&auto=format&fit=crop&q=80",
    query: "Chips",
    bg: "bg-amber-50/60",
  },
  {
    name: "Cold Drinks & Juices",
    img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80",
    query: "Cold Drinks",
    bg: "bg-cyan-50/60",
  },
  {
    name: "Breakfast & Instant Food",
    img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=80",
    query: "Breakfast",
    bg: "bg-yellow-50/60",
  },
  {
    name: "Sweet Tooth",
    img: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&auto=format&fit=crop&q=80",
    query: "Sweet Tooth",
    bg: "bg-pink-50/60",
  },
  {
    name: "Bakery & Biscuits",
    img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80",
    query: "Bakery",
    bg: "bg-orange-50/60",
  },
  {
    name: "Tea, Coffee & Drinks",
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80",
    query: "Tea",
    bg: "bg-emerald-50/60",
  },
  {
    name: "Atta, Rice & Dal",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80",
    query: "Atta",
    bg: "bg-stone-50/60",
  },
  {
    name: "Masala, Oil & More",
    img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80",
    query: "Masala",
    bg: "bg-red-50/60",
  },
  {
    name: "Cleaning Essentials",
    img: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80",
    query: "Cleaning",
    bg: "bg-teal-50/60",
  },
  {
    name: "Personal Care",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80",
    query: "Personal Care",
    bg: "bg-indigo-50/60",
  },
  {
    name: "Clothes & Fabrics",
    img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=200&auto=format&fit=crop&q=80",
    query: "Clothes",
    bg: "bg-violet-50/60",
  },
  {
    name: "3D Prints & Custom",
    img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop&q=80",
    query: "Custom",
    bg: "bg-slate-50/60",
  },
];

export default function CustomerHomePage() {
  const [currentLocality, setCurrentLocality] = useState("Kukas, Jaipur (RIICO / Colleges)");
  const [currentLat, setCurrentLat] = useState(27.0544);
  const [currentLng, setCurrentLng] = useState(75.8942);
  const [activeMode, setActiveMode] = useState<"LOCAL" | "PAN_INDIA">("LOCAL");
  const [feedData, setFeedData] = useState<DiscoveryFeedResponse | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // User session state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Cart & UI state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active tracking order state
  const [activeOrder, setActiveOrder] = useState<OrderCheckoutResponse["order"] | null>(null);

  // 1. Automatic GPS Location Detection on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentLat(lat);
          setCurrentLng(lng);
          // Auto label Jaipur Division
          setCurrentLocality("Jaipur Division, Rajasthan");
        },
        () => {
          // If denied, fallback to default Kukas, Jaipur
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // 2. Check user session on initial load
  useEffect(() => {
    const token = localStorage.getItem("servo_token");
    if (token) {
      getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem("servo_token");
          setUser(null);
        });
    }
  }, []);

  // 3. Fetch Discovery Feed from live Neon DB
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const data = await getDiscoveryFeed(currentLat, currentLng, activeMode, currentLocality);
      setFeedData(data);
    } catch {
      // Handled gracefully
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
          shop_id: product.shop_id || 1,
          shop_name: product.shop_name || "Sharma Ji Daily Kirana",
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

  // Area Demand Submission
  const handleSubmitDemand = async (phone: string) => {
    await submitAreaDemand({
      lat: currentLat,
      lng: currentLng,
      locality_name: currentLocality,
      phone_or_email: phone,
    });
  };

  // Real Database Products & Shops
  const allProducts: ProductItem[] = feedData?.all_products || [];
  const shops: ShopItem[] = feedData?.shops || [];

  // Filtered Category Products
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

  // Dedicated Product Rails
  const chipsProducts = allProducts.filter(
    (p) =>
      p.category === "Kirana" &&
      (p.sub_category?.includes("Chips") ||
        p.name.toLowerCase().includes("lays") ||
        p.name.toLowerCase().includes("kurkure") ||
        p.name.toLowerCase().includes("bingo") ||
        p.name.toLowerCase().includes("bhujia") ||
        p.name.toLowerCase().includes("snack"))
  );

  const dairyProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("dairy") ||
      p.sub_category?.toLowerCase().includes("dairy") ||
      p.sub_category?.toLowerCase().includes("bread") ||
      p.name.toLowerCase().includes("milk") ||
      p.name.toLowerCase().includes("butter") ||
      p.name.toLowerCase().includes("bread") ||
      p.name.toLowerCase().includes("egg")
  );

  const coldDrinksProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("drink") ||
      p.sub_category?.toLowerCase().includes("drink") ||
      p.name.toLowerCase().includes("coca") ||
      p.name.toLowerCase().includes("sprite") ||
      p.name.toLowerCase().includes("juice") ||
      p.name.toLowerCase().includes("frooti") ||
      p.name.toLowerCase().includes("pepsi")
  );

  const instantProducts = allProducts.filter(
    (p) =>
      p.sub_category?.toLowerCase().includes("instant") ||
      p.name.toLowerCase().includes("maggi") ||
      p.name.toLowerCase().includes("noodle") ||
      p.name.toLowerCase().includes("chocos")
  );

  const sweetsProducts = allProducts.filter(
    (p) =>
      p.category === "Sweets" ||
      p.sub_category?.toLowerCase().includes("sweet") ||
      p.name.toLowerCase().includes("silk") ||
      p.name.toLowerCase().includes("chocolate") ||
      p.name.toLowerCase().includes("gulab jamun") ||
      p.name.toLowerCase().includes("kaju")
  );

  const bakeryProducts = allProducts.filter(
    (p) =>
      p.category === "Bakery" ||
      p.sub_category?.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("parle") ||
      p.name.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("cookie") ||
      p.name.toLowerCase().includes("oreo")
  );

  const staplesProducts = allProducts.filter(
    (p) =>
      p.sub_category?.toLowerCase().includes("atta") ||
      p.sub_category?.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("atta") ||
      p.name.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("salt") ||
      p.name.toLowerCase().includes("rice")
  );

  const panIndiaProducts = allProducts.filter(
    (p) => p.is_pan_india_eligible || p.category === "Clothes" || p.category === "Custom/3D"
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col select-none">
      {/* ── 1. Sticky Navbar & Search (Exact Blinkit Style) ────────── */}
      <HeaderAndSearch
        currentLocality={currentLocality}
        onLocalityChange={handleLocalityChange}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onLoginSuccess={(u) => setUser(u)}
        onLogout={() => {
          localStorage.removeItem("servo_token");
          setUser(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-6">
        {/* ── 2. Promotional Banners Row (Blinkit Image 1 Style) ────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 select-none">
          {/* Card 1: Medicines & Daily Care */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                12-15 Mins
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Pharmacy & Daily Care at your doorstep!
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">
                Balms, pain relief, health drinks & daily essentials
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => setSelectedCategory("Personal Care")}
                className="px-3.5 py-1.5 rounded-xl bg-white text-teal-900 font-black text-xs hover:bg-teal-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now
              </button>
            </div>
            <div className="absolute right-2 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-85 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"
                alt="Pharmacy"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Card 2: Chips & Midnight Munchies */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Instant Munchies
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Midnight snacks & crisps at your door!
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                Lay&apos;s, Kurkure, nachos & spicy namkeen
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => {
                  const el = document.getElementById("snacks-rail");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-orange-950 font-black text-xs hover:bg-orange-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now
              </button>
            </div>
            <div className="absolute right-2 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-85 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80"
                alt="Snacks"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Card 3: Fresh Dairy & Morning Breakfast */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Fresh Daily
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Morning dairy, fresh bread & eggs!
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Amul Milk, butter, brown bread & farm eggs
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => setSelectedCategory("Dairy, Bread & Eggs")}
                className="px-3.5 py-1.5 rounded-xl bg-white text-blue-950 font-black text-xs hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now
              </button>
            </div>
            <div className="absolute right-2 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-85 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80"
                alt="Dairy"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* ── 3. Category Grid (Exact Blinkit Image 1 Replica) ───────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Explore Categories
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-[#0C831F] font-black hover:underline cursor-pointer"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {CATEGORY_GRID.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.name);
                  }}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center text-center group cursor-pointer relative ${
                    isSelected
                      ? "bg-emerald-50 border-[#0C831F] shadow-sm scale-102"
                      : "bg-[#F9FAFB] border-slate-100/80 hover:bg-white hover:shadow-md hover:border-slate-200"
                  }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 mb-1.5 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-bold line-clamp-2 leading-tight ${
                      isSelected ? "text-[#0C831F]" : "text-slate-800"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Filtered Rail ───────────────────────────────────── */}
        {selectedCategory && (
          <div className="p-4 rounded-3xl bg-slate-50/70 border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedCategory}
                </h3>
                <p className="text-[11px] text-[#0C831F] font-bold">
                  {filteredCategoryProducts.length} items available in store
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black transition-colors"
              >
                Clear Filter ✕
              </button>
            </div>

            <ProductCardAndRails
              title={`All in ${selectedCategory}`}
              products={filteredCategoryProducts}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
            />
          </div>
        )}

        {/* ── 4. Unserviceable Area Screen (Exact Blinkit Image 2 Replica) */}
        {feedData && !feedData.is_area_serviceable && (
          <BlinkitUnserviceableState
            currentLocality={currentLocality}
            onSelectLocality={handleLocalityChange}
            onSubmitDemand={handleSubmitDemand}
            onSwitchToPanIndia={() => setActiveMode("PAN_INDIA")}
          />
        )}

        {/* ── 5. Skeleton Loading State (While Feed is loading) ─────── */}
        {loadingFeed && (
          <div className="space-y-4 pt-2">
            <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl bg-white p-3 border border-slate-100 shadow-xs space-y-2 animate-pulse"
                >
                  <div className="w-full h-32 bg-slate-100 rounded-xl" />
                  <div className="w-16 h-3 bg-slate-100 rounded" />
                  <div className="w-full h-4 bg-slate-100 rounded" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-12 h-4 bg-slate-100 rounded" />
                    <div className="w-14 h-7 bg-slate-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Product Rails (Real Live Neon DB Data Only) ─────────── */}
        {/* Rail A: Featured Neighborhood Stores */}
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

        {/* Rail D: Cold Drinks & Juices */}
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

        {/* Rail F: Chocolates & Sweets */}
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

        {/* Fallback All Store Catalog */}
        {allProducts.length > 0 && chipsProducts.length === 0 && (
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

      {/* ── 7. Bottom Sticky Cart Bar for Mobile ───────────────────── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#0C831F] text-white font-black text-xs flex items-center justify-between shadow-lg active:scale-98"
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

      {/* ── 8. Smart Cart Drawer ───────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onAddToCart={handleAddToCart}
        onOrderPlaced={(orderData) => {
          setActiveOrder(orderData);
          setCart([]);
        }}
        currentLocality={currentLocality}
      />

      {/* ── 9. Live Order Tracker & Review Popup ────────────────────── */}
      {activeOrder && (
        <LiveOrderTrackerAndReview
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
}
