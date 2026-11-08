"use client";

import { useState, useEffect, useMemo } from "react";
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
  Star,
  Layers
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
import {
  MASTER_SHOPS,
  MASTER_PRODUCTS,
  CATEGORIES_HIERARCHY,
  MasterShop,
  MasterProduct
} from "@/lib/masterCatalogData";
import HeaderAndSearch from "@/components/HeaderAndSearch";
import ProductCardAndRails from "@/components/ProductCardAndRails";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import LiveOrderTrackerAndReview from "@/components/LiveOrderTrackerAndReview";
import BlinkitUnserviceableState from "@/components/BlinkitUnserviceableState";
import BlinkitSplitViewStorefront from "@/components/BlinkitSplitViewStorefront";

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
    name: "Hot Street Food & Chai",
    img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop&q=80",
    query: "Street Stalls",
    bg: "bg-orange-50/60",
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
    query: "Instant Food",
    bg: "bg-yellow-50/60",
  },
  {
    name: "Sweet Tooth & Mithai",
    img: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&auto=format&fit=crop&q=80",
    query: "Sweets",
    bg: "bg-pink-50/60",
  },
  {
    name: "Bakery & Biscuits",
    img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80",
    query: "Bakery",
    bg: "bg-orange-50/60",
  },
  {
    name: "Atta, Rice & Staples",
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&auto=format&fit=crop&q=80",
    query: "Atta",
    bg: "bg-stone-50/60",
  },
  {
    name: "Clothes & 3D Prints (Pan-India)",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=80",
    query: "Clothes",
    bg: "bg-violet-50/60",
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

  // Cart & Active order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderCheckoutResponse["order"] | null>(null);

  // ── Split-View Storefront Modal / View State ─────────────────────────────
  const [activeSplitCategory, setActiveSplitCategory] = useState<string | null>(null);
  const [activeSplitShop, setActiveSplitShop] = useState<{ name: string; id?: number } | null>(null);

  // 1. Automatic GPS Location Detection on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentLat(lat);
          setCurrentLng(lng);
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
      // Handled gracefully with master fallback
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
    const price = variant ? variant.price : product.selling_price || product.price || product.mrp;
    const variantId = variant ? variant.id : undefined;
    const packLabel = variant ? variant.weight_or_size : product.default_weight_or_size || product.weight_or_size;

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
          shop_name: product.shop_name || "Sharma Kirana & Supermart",
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

  // ── Merged Real Products & 6 Verified Shops (Never Blank / 0 Items) ──────
  const dbProducts: ProductItem[] = feedData?.all_products || [];
  const dbShops: ShopItem[] = feedData?.shops || [];

  // Merge database items with MASTER_PRODUCTS fallback so every category has 6-8+ items
  const allProducts = useMemo(() => {
    if (dbProducts.length >= 20) {
      return dbProducts;
    }
    // Combine unique by name
    const combined = [...dbProducts];
    const existingNames = new Set(dbProducts.map((p) => p.name.toLowerCase()));
    for (const m of MASTER_PRODUCTS) {
      if (!existingNames.has(m.name.toLowerCase())) {
        combined.push(m as any);
      }
    }
    return combined;
  }, [dbProducts]);

  // Merge database shops with MASTER_SHOPS so all 6 verified local shops are present
  const allShops = useMemo(() => {
    if (dbShops.length >= 6) {
      return dbShops;
    }
    const combined = [...dbShops];
    const existingShopNames = new Set(dbShops.map((s) => s.name.toLowerCase()));
    for (const ms of MASTER_SHOPS) {
      if (!existingShopNames.has(ms.name.toLowerCase())) {
        combined.push(ms as any);
      }
    }
    return combined;
  }, [dbShops]);

  // Dedicated Product Rails Filter
  const dairyProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("dairy") ||
      p.sub_category?.toLowerCase().includes("dairy") ||
      p.name.toLowerCase().includes("milk") ||
      p.name.toLowerCase().includes("butter") ||
      p.name.toLowerCase().includes("bread") ||
      p.name.toLowerCase().includes("egg") ||
      p.name.toLowerCase().includes("dahi") ||
      p.name.toLowerCase().includes("curd") ||
      p.name.toLowerCase().includes("paneer")
  );

  const chipsProducts = allProducts.filter(
    (p) =>
      p.category === "Kirana" ||
      p.category?.toLowerCase().includes("snack") ||
      p.sub_category?.toLowerCase().includes("chips") ||
      p.sub_category?.toLowerCase().includes("namkeen") ||
      p.name.toLowerCase().includes("lays") ||
      p.name.toLowerCase().includes("kurkure") ||
      p.name.toLowerCase().includes("bingo") ||
      p.name.toLowerCase().includes("bhujia")
  );

  const streetFoodProducts = allProducts.filter(
    (p) =>
      p.sub_category?.toLowerCase().includes("street") ||
      p.name.toLowerCase().includes("samosa") ||
      p.name.toLowerCase().includes("kachori") ||
      p.name.toLowerCase().includes("chaat") ||
      p.name.toLowerCase().includes("tikki") ||
      p.name.toLowerCase().includes("chai")
  );

  const coldDrinksProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("drink") ||
      p.sub_category?.toLowerCase().includes("drink") ||
      p.name.toLowerCase().includes("coca") ||
      p.name.toLowerCase().includes("coke") ||
      p.name.toLowerCase().includes("sprite") ||
      p.name.toLowerCase().includes("thums") ||
      p.name.toLowerCase().includes("frooti") ||
      p.name.toLowerCase().includes("red bull")
  );

  const instantProducts = allProducts.filter(
    (p) =>
      p.sub_category?.toLowerCase().includes("instant") ||
      p.name.toLowerCase().includes("maggi") ||
      p.name.toLowerCase().includes("noodle") ||
      p.name.toLowerCase().includes("corn flakes")
  );

  const sweetsProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("sweet") ||
      p.sub_category?.toLowerCase().includes("sweet") ||
      p.sub_category?.toLowerCase().includes("mithai") ||
      p.name.toLowerCase().includes("gulab jamun") ||
      p.name.toLowerCase().includes("kaju katli") ||
      p.name.toLowerCase().includes("silk") ||
      p.name.toLowerCase().includes("chocolate")
  );

  const bakeryProducts = allProducts.filter(
    (p) =>
      p.category?.toLowerCase().includes("bakery") ||
      p.sub_category?.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("parle") ||
      p.name.toLowerCase().includes("good day") ||
      p.name.toLowerCase().includes("oreo")
  );

  const staplesProducts = allProducts.filter(
    (p) =>
      p.sub_category?.toLowerCase().includes("atta") ||
      p.sub_category?.toLowerCase().includes("oil") ||
      p.sub_category?.toLowerCase().includes("rice") ||
      p.name.toLowerCase().includes("atta") ||
      p.name.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("salt") ||
      p.name.toLowerCase().includes("rice")
  );

  const panIndiaProducts = allProducts.filter(
    (p) => p.is_pan_india_eligible || p.category === "Clothes" || p.category === "Custom/3D"
  );

  // Shop Selection Handler
  const handleSelectShop = (shopName: string, shopId?: number) => {
    setActiveSplitShop({ name: shopName, id: shopId });
    setActiveSplitCategory(null);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  // Category Selection Handler (Blinkit Split-View)
  const handleSelectCategory = (categoryName: string) => {
    setActiveSplitCategory(categoryName);
    setActiveSplitShop(null);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

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
        {/* ── 2. Top Promotional Banners (Blinkit Standard) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 select-none">
          {/* Card 1: Fresh Dairy & Morning Breakfast */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Fresh Daily
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Morning dairy, fresh bread & farm eggs!
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Amul Milk, Saras Dahi, table butter & bread
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => handleSelectCategory("Dairy, Bread & Eggs")}
                className="px-4 py-2 rounded-xl bg-white text-blue-950 font-black text-xs hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now →
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

          {/* Card 2: Crispy Snacks & Munchies */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                10-15 Mins
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Midnight snacks & crisps at your door!
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                Lay&apos;s, Kurkure, Bingo & Haldiram&apos;s Bhujia
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => handleSelectCategory("Snacks & Munchies")}
                className="px-4 py-2 rounded-xl bg-white text-orange-950 font-black text-xs hover:bg-orange-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now →
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

          {/* Card 3: Hot Street Food (Runner Mode) */}
          <div className="rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 text-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all min-h-[160px]">
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Runner Mode
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight pt-1">
                Garam Samosa & Pyaaz Kachori with Chai!
              </h3>
              <p className="text-[11px] text-rose-100 font-medium">
                From Raju Bhaiya&apos;s Famous Stall in 12 mins
              </p>
            </div>
            <div className="pt-3 relative z-10">
              <button
                onClick={() => handleSelectShop("Raju Bhaiya Famous Samosa & Chaat Stall", 5)}
                className="px-4 py-2 rounded-xl bg-white text-rose-950 font-black text-xs hover:bg-rose-50 transition-all shadow-xs cursor-pointer"
              >
                Order Now →
              </button>
            </div>
            <div className="absolute right-2 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-85 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80"
                alt="Hot Samosa"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* ── 3. TOP SECTION: 🏪 Verified Local Shops & Street Stalls (Zomato Style) ─ */}
        <section className="py-2 select-none">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  🏪 Verified Local Shops & Stalls Near You
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#0C831F] border border-emerald-200">
                  {allShops.length} Stores Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real local Kirana stores, Dairy parlours & street stalls delivering in 8-15 mins
              </p>
            </div>
          </div>

          {/* Horizontally Scrollable Shop Cards */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0">
            {allShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => handleSelectShop(shop.name, shop.id)}
                className="w-64 sm:w-72 shrink-0 bg-white rounded-3xl p-3.5 border border-slate-200/90 hover:border-[#0C831F] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative mb-3">
                    <img
                      src={shop.image_url}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Delivery ETA Pill */}
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{shop.local_eta_mins || "⚡ 10 mins"}</span>
                    </span>

                    {/* Rating Pill */}
                    <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-[10px] font-extrabold text-slate-900 flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{shop.rating || 4.8}</span>
                    </span>

                    {/* Verified Tick */}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0C831F] transition-colors truncate">
                    {shop.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {shop.category} • {shop.locality_name}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#0C831F] font-bold text-[10px]">
                    Free Delivery &gt; ₹{shop.min_order_for_free_delivery || 150}
                  </span>
                  <span className="text-xs font-black text-[#0C831F] group-hover:underline flex items-center gap-0.5">
                    <span>Visit Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. BLINKIT SPLIT-VIEW STOREFRONT (If Category or Shop is Clicked) ─ */}
        <AnimatePresence>
          {(activeSplitCategory || activeSplitShop) && (
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="py-2"
            >
              <BlinkitSplitViewStorefront
                categoryName={activeSplitCategory || undefined}
                shopName={activeSplitShop?.name}
                shopId={activeSplitShop?.id}
                allProducts={allProducts}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onClose={() => {
                  setActiveSplitCategory(null);
                  setActiveSplitShop(null);
                }}
                onSelectShop={handleSelectShop}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── 5. Category Icons Grid (Exact Blinkit Style) ─────────────── */}
        <section className="space-y-3 pt-2 select-none">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Explore Categories
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Click any category to open Split-View
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 sm:gap-3">
            {CATEGORY_GRID.map((cat) => {
              const isActive = activeSplitCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleSelectCategory(cat.name)}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center text-center group cursor-pointer relative ${
                    isActive
                      ? "bg-emerald-50 border-[#0C831F] shadow-sm scale-102"
                      : "bg-[#F9FAFB] border-slate-100/90 hover:bg-white hover:shadow-md hover:border-slate-200"
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
                    className={`text-[11px] font-bold line-clamp-2 leading-tight ${
                      isActive ? "text-[#0C831F] font-black" : "text-slate-800"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 6. Unserviceable Area Screen (Exact Blinkit Replica) ────── */}
        {feedData && !feedData.is_area_serviceable && (
          <BlinkitUnserviceableState
            currentLocality={currentLocality}
            onSelectLocality={handleLocalityChange}
            onSubmitDemand={handleSubmitDemand}
            onSwitchToPanIndia={() => setActiveMode("PAN_INDIA")}
          />
        )}

        {/* ── 7. Skeleton Loading State (While Feed is loading) ──────── */}
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

        {/* ── 8. Product Rails (Real Clean Studio Packshots + Zomato Shop Badges) */}
        {/* Rail A: Dairy, Bread & Farm Fresh Eggs */}
        {dairyProducts.length > 0 && (
          <ProductCardAndRails
            title="Dairy, Bread & Farm Fresh Eggs"
            badge="⚡ 8 Mins"
            products={dairyProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Dairy, Bread & Eggs")}
          />
        )}

        {/* Rail B: Chips, Namkeen & Munchies */}
        {chipsProducts.length > 0 && (
          <ProductCardAndRails
            title="Chips, Namkeen & Munchies"
            badge="⚡ 10 Mins"
            products={chipsProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Snacks & Munchies")}
          />
        )}

        {/* Rail C: Hot Street Food & Chai (Runner Mode) */}
        {streetFoodProducts.length > 0 && (
          <ProductCardAndRails
            title="Hot Street Food & Chai (Runner Mode)"
            badge="⚡ 12 Mins"
            products={streetFoodProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectShop("Raju Bhaiya Famous Samosa & Chaat Stall", 5)}
          />
        )}

        {/* Rail D: Cold Drinks & Juices */}
        {coldDrinksProducts.length > 0 && (
          <ProductCardAndRails
            title="Cold Drinks, Juices & Energy Boosters"
            badge="⚡ 14 Mins"
            products={coldDrinksProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Cold Drinks & Juices")}
          />
        )}

        {/* Rail E: Maggi, Noodles & Instant Food */}
        {instantProducts.length > 0 && (
          <ProductCardAndRails
            title="Maggi, Noodles & Quick Cravings"
            badge="⚡ 10 Mins"
            products={instantProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Breakfast & Instant Food")}
          />
        )}

        {/* Rail F: Chocolates & Sweet Tooth */}
        {sweetsProducts.length > 0 && (
          <ProductCardAndRails
            title="Chocolates & Desi Mithai Treats"
            badge="⚡ 15 Mins"
            products={sweetsProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Sweet Tooth & Mithai")}
          />
        )}

        {/* Rail G: Bakery & Biscuits */}
        {bakeryProducts.length > 0 && (
          <ProductCardAndRails
            title="Bakery, Cookies & Parle-G"
            badge="Verified Stock"
            products={bakeryProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Bakery & Biscuits")}
          />
        )}

        {/* Rail H: Atta, Rice & Kitchen Staples */}
        {staplesProducts.length > 0 && (
          <ProductCardAndRails
            title="Atta, Rice & Kitchen Staples"
            badge="Direct Store"
            products={staplesProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectCategory("Atta, Rice & Staples")}
          />
        )}

        {/* Rail I: Pan-India Clothes & 3D Prints */}
        {panIndiaProducts.length > 0 && (
          <ProductCardAndRails
            title="Pan-India Custom Apparel & 3D Prints"
            badge="📦 Ships All India"
            products={panIndiaProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectShop={handleSelectShop}
            onSeeAll={() => handleSelectShop("PrintCraft & Fashion Studio", 6)}
          />
        )}
      </main>

      {/* ── 9. Bottom Sticky Cart Bar for Mobile ───────────────────── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#0C831F] text-white font-black text-xs flex items-center justify-between shadow-lg active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} Items Added</span>
            </div>
            <div className="flex items-center gap-2">
              <span>View Cart</span>
              <span className="font-mono">
                ₹{cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(0)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── 10. Smart Cart Drawer ──────────────────────────────────── */}
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

      {/* ── 11. Live Order Tracker & Review Popup ───────────────────── */}
      {activeOrder && (
        <LiveOrderTrackerAndReview
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
}
