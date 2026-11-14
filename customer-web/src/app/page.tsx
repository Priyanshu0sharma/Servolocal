"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  ArrowRight,
  Store,
  Tag,
  ShoppingBag,
  Zap,
  Utensils,
  Package,
  Coins,
  HelpCircle,
  Truck,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Star,
} from "lucide-react";

import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Sidebar, { SidebarTab } from "@/components/Sidebar";
import HeroBanner from "@/components/HeroBanner";
import DeliveryModesStrip, { DeliveryMode } from "@/components/DeliveryModesStrip";
import CategoriesSection from "@/components/CategoriesSection";
import PromoBannersSection from "@/components/PromoBannersSection";
import PopularShopsSection, { ShopItem } from "@/components/PopularShopsSection";
import TrendingProductsSection from "@/components/TrendingProductsSection";
import BenefitsStrip from "@/components/BenefitsStrip";
import HowItWorksSection from "@/components/HowItWorksSection";
import AppPromoBanner from "@/components/AppPromoBanner";
import Footer from "@/components/Footer";
import CategoryCard, { CATEGORIES_DATA } from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import BlinkitSplitViewStorefront from "@/components/BlinkitSplitViewStorefront";
import LiveOrderTrackerAndReview, { ActiveOrderData } from "@/components/LiveOrderTrackerAndReview";
import FloatingCartBar from "@/components/FloatingCartBar";
import ProductDetailsModal from "@/components/ProductDetailsModal";
import WalletModal from "@/components/WalletModal";
import SupportModal from "@/components/SupportModal";
import CustomerProfileView from "@/components/CustomerProfileView";
import AccountSettingsView from "@/components/AccountSettingsView";

import { ProductItem, CartItem, UserProfile, CategoryItem } from "@/types";
import { MASTER_PRODUCTS, MASTER_SHOPS } from "@/lib/masterCatalogData";
import { getDiscoveryFeed } from "@/lib/api";

export default function CustomerHomePage() {
  // ── 1. Locality & GPS State ───────────────────────────────────────────────
  const [currentLocality, setCurrentLocality] = useState<string>("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [currentLat, setCurrentLat] = useState(27.0544);
  const [currentLng, setCurrentLng] = useState(75.8942);

  // ── 2. Navigation & View State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SidebarTab>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeStorefrontShop, setActiveStorefrontShop] = useState<{
    name: string;
    id?: number;
  } | null>(null);

  // ── 2B. Stores Filtering State (Open / Closed) ───────────────────────────
  const [storeStatusFilter, setStoreStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>("");

  // ── 3. Modals & Detail Views ──────────────────────────────────────────────
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // ── 4. Real Database Feeds (PostgreSQL via FastAPI Backend) ───────────────
  const [dbShops, setDbShops] = useState<ShopItem[]>([]);
  const [dbProducts, setDbProducts] = useState<ProductItem[]>([]);
  const [activeDeliveryMode, setActiveDeliveryMode] = useState<DeliveryMode>("MINUTES");
  const [, setIsFeedLoading] = useState(true);

  // ── 5. User Session State ─────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // ── 6. Cart & Drawer State ────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── 7. Active Order State (Live 10-15 Min Tracking) ───────────────────────
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);

  // ── 8. Wishlist State (Persisted) ─────────────────────────────────────────
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("servo_wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

        const savedCart = localStorage.getItem("servo_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedUser = localStorage.getItem("servo_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && (!parsed.name || parsed.name.includes("1131") || parsed.name === parsed.email)) {
            if (parsed.email && parsed.email.toLowerCase().includes("priyanshu")) {
              parsed.name = "Priyanshu Sharma";
              if (!parsed.gender) parsed.gender = "Male";
              localStorage.setItem("servo_user", JSON.stringify(parsed));
            }
          }
          setUser(parsed);
        }

        const savedLocality = localStorage.getItem("servo_locality");
        if (savedLocality) {
          setCurrentLocality(savedLocality);
        } else {
          // In incognito or first visit, show the authentic Blinkit location prompt immediately!
          setIsLocationOpen(true);
        }

        const savedCoords = localStorage.getItem("servo_delivery_coords");
        if (savedCoords) {
          try {
            const parsedCoords = JSON.parse(savedCoords);
            if (parsedCoords?.lat) setCurrentLat(parsedCoords.lat);
            if (parsedCoords?.lng) setCurrentLng(parsedCoords.lng);
          } catch {}
        }

        const savedOrder = localStorage.getItem("servo_active_order");
        if (savedOrder) setActiveOrder(JSON.parse(savedOrder));
      } catch {}
    }
  }, []);

  // Fetch real database records from Neon PostgreSQL via FastAPI discovery feed
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveFeed() {
      setIsFeedLoading(true);
      try {
        const feedMode = activeDeliveryMode === "PAN_INDIA" ? "PAN_INDIA" : "LOCAL";
        const data = await getDiscoveryFeed(
          currentLat,
          currentLng,
          feedMode,
          currentLocality || "Current Location"
        );
        if (isMounted && data) {
          if (data.shops && data.shops.length > 0) {
            setDbShops(data.shops);
          }
          if (data.all_products && data.all_products.length > 0) {
            setDbProducts(data.all_products);
          }
        }
      } catch (err) {
        console.error("Live backend feed error:", err);
      } finally {
        if (isMounted) setIsFeedLoading(false);
      }
    }
    fetchLiveFeed();
    return () => {
      isMounted = false;
    };
  }, [currentLocality, activeDeliveryMode, currentLat, currentLng]);

  const handleLocalityChange = (locality: string, lat: number, lng: number) => {
    setCurrentLocality(locality);
    setCurrentLat(lat);
    setCurrentLng(lng);
    setIsLocationOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("servo_locality", locality);
    }
  };

  const handleCloseLocation = () => {
    setIsLocationOpen(false);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_wishlist", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleAddToCart = (
    product: ProductItem,
    sellerOffer?: {
      shop_id: number;
      shop_name: string;
      selling_price: number;
      inventory_id?: number;
    }
  ) => {
    const invId = sellerOffer?.inventory_id || product.id;
    const price =
      sellerOffer?.selling_price !== undefined
        ? sellerOffer.selling_price
        : product.selling_price;
    const shopId = sellerOffer?.shop_id || product.shop_id || 1;
    const shopName =
      sellerOffer?.shop_name || product.shop_name || "Verified Local Store";

    setCart((prev) => {
      const existing = prev.find((item) => item.inventory_id === invId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.inventory_id === invId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [
          ...prev,
          {
            inventory_id: invId,
            name: product.name,
            image_url: product.image_url,
            price: price,
            mrp: product.mrp,
            quantity: 1,
            shop_id: shopId,
            shop_name: shopName,
          },
        ];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_cart", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleUpdateCartQuantity = (inventoryId: number, qty: number) => {
    setCart((prev) => {
      let updated: CartItem[];
      if (qty <= 0) {
        updated = prev.filter((item) => item.inventory_id !== inventoryId);
      } else {
        updated = prev.map((item) =>
          item.inventory_id === inventoryId ? { ...item, quantity: qty } : item
        );
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_cart", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("servo_cart");
    }
  };

  const handleOrderPlaced = (newOrder: ActiveOrderData) => {
    setActiveOrder(newOrder);
    if (typeof window !== "undefined") {
      localStorage.setItem("servo_active_order", JSON.stringify(newOrder));
    }
  };

  const handleCloseActiveOrder = () => {
    setActiveOrder(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("servo_active_order");
    }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("servo_user", JSON.stringify(newUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("servo_user");
    }
  };

  // Real Database Products (Primary from live Neon PostgreSQL, with local backup)
  const allProducts: ProductItem[] = useMemo(() => {
    if (dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand || "Local Store",
        category: p.category,
        sub_category: p.sub_category,
        unit: p.unit || p.default_weight_or_size || "1 Unit",
        default_weight_or_size: p.default_weight_or_size || p.unit || "1 Unit",
        selling_price: p.selling_price,
        mrp: p.mrp || p.selling_price,
        rating: p.rating || 4.7,
        image_url: p.image_url,
        in_stock: p.in_stock !== false,
        available_stock: p.available_stock || 50,
        shop_id: p.shop_id || 1,
        shop_name: p.shop_name || "Verified Local Store",
        local_eta_mins: p.local_eta_mins || "⚡ 10 mins",
      }));
    }
    return MASTER_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      sub_category: p.sub_category,
      selling_price: p.selling_price,
      mrp: p.mrp,
      rating:
        p.id === 9001
          ? 4.6
          : p.id === 9002
          ? 4.8
          : p.id === 9003
          ? 4.5
          : p.id === 9004
          ? 4.7
          : 4.6,
      image_url: p.image_url,
      in_stock: p.in_stock,
      available_stock: p.available_stock,
      shop_id: p.shop_id,
      shop_name: p.shop_name,
      local_eta_mins: p.local_eta_mins,
    }));
  }, [dbProducts]);

  // Real Database Shops (Primary from live Neon PostgreSQL)
  const currentShops: ShopItem[] = useMemo(() => {
    if (dbShops.length > 0) {
      return dbShops.map((s) => ({
        ...s,
        is_open: s.is_open !== undefined ? s.is_open : true,
        timing_info: s.timing_info || (s.is_open ? "Open Now • Closes 10:30 PM" : "Closed Now • Opens 7:00 AM"),
      }));
    }
    return MASTER_SHOPS.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      image_url: s.image_url,
      is_open: s.is_open,
      rating: s.rating,
      locality_name: s.locality_name,
      distance_km: s.distance_km,
      local_eta_mins: s.local_eta_mins,
      free_delivery_enabled: s.free_delivery_enabled,
      is_verified: s.is_verified,
      timing_info: s.timing_info || (s.is_open ? "Open Now • Closes 10:30 PM" : "Closed Now • Opens 7:00 AM"),
    }));
  }, [dbShops]);

  // Filtered Stores (Open, Closed, Search)
  const filteredStoresList: ShopItem[] = useMemo(() => {
    return currentShops.filter((shop) => {
      if (storeStatusFilter === "OPEN" && shop.is_open === false) return false;
      if (storeStatusFilter === "CLOSED" && shop.is_open !== false) return false;
      if (storeSearchQuery.trim()) {
        const q = storeSearchQuery.toLowerCase();
        const matchName = shop.name.toLowerCase().includes(q);
        const matchCat = shop.category.toLowerCase().includes(q);
        const matchLoc = (shop.locality_name || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchLoc) return false;
      }
      return true;
    });
  }, [currentShops, storeStatusFilter, storeSearchQuery]);

  const openStoresCount = useMemo(() => currentShops.filter((s) => s.is_open !== false).length, [currentShops]);
  const closedStoresCount = useMemo(() => currentShops.filter((s) => s.is_open === false).length, [currentShops]);

  // 4 Showcase Products with Real High-Definition Images
  const popularNearYouProducts: ProductItem[] = useMemo(() => {
    const popularIds = [9001, 9002, 9003, 9004];
    const items = allProducts.filter((p) => popularIds.includes(p.id));
    return items.sort((a, b) => popularIds.indexOf(a.id) - popularIds.indexOf(b.id));
  }, [allProducts]);

  // Real Dairy & Morning Staples Shelf
  const dailyDairyProducts: ProductItem[] = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category === "Dairy, Bread & Eggs" ||
        p.sub_category === "Milk & Cream" ||
        p.sub_category === "Butter & Cheese" ||
        p.sub_category === "Bread & Buns" ||
        p.sub_category === "Farm Eggs" ||
        ["Amul", "Saras", "Britannia", "Harvest Gold", "Eggs", "Milk", "Curd", "Dahi", "Paneer", "Butter"].some((n) =>
          p.name.toLowerCase().includes(n.toLowerCase())
        )
    );
  }, [allProducts]);

  // Real Soft Drinks & Cold Beverages Shelf
  const softDrinksShelf: ProductItem[] = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category === "Cold Drinks & Juices" ||
        p.sub_category === "Soft Drinks" ||
        p.sub_category === "Juices & Shakes" ||
        p.sub_category === "Energy Drinks" ||
        ["Thums Up", "Coca-Cola", "Sprite", "Pepsi", "Appy Fizz", "Red Bull", "Real Fruit", "Bisleri"].some((n) =>
          p.name.toLowerCase().includes(n.toLowerCase())
        )
    );
  }, [allProducts]);

  // Real Snacks, Chips & Munchies Shelf
  const snacksAndMunchiesProducts: ProductItem[] = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category === "Snacks & Munchies" ||
        p.sub_category === "Chips & Crisps" ||
        p.sub_category === "Namkeen & Snacks" ||
        ["Lay's", "Kurkure", "Bhujia", "Chips", "Orbit", "Aloo Bhujia"].some((n) =>
          p.name.toLowerCase().includes(n.toLowerCase())
        )
    );
  }, [allProducts]);

  // Real Instant Food, Staples & Atta Shelf
  const staplesShelf: ProductItem[] = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category === "Atta, Rice & Staples" ||
        p.category === "Breakfast & Instant Food" ||
        p.sub_category === "Maggi & Noodles" ||
        p.sub_category === "Atta & Flours" ||
        ["Maggi", "Atta", "Rice", "Mustard Oil", "Tata Salt", "Tea", "Coffee", "Bournvita", "Basmati", "Dal"].some((n) =>
          p.name.toLowerCase().includes(n.toLowerCase())
        )
    );
  }, [allProducts]);

  // Real Pharmacy, Hygiene & Cleaning Shelf
  const careShelf: ProductItem[] = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category === "Pharmacy" ||
        p.category === "Home & Kitchen" ||
        p.category === "Beauty & Care" ||
        ["Dettol", "Colgate", "Dolo", "Vicks", "Surf Excel", "Vim", "Lizol", "Handwash", "Soap", "Cleaner"].some((n) =>
          p.name.toLowerCase().includes(n.toLowerCase())
        )
    );
  }, [allProducts]);

  // Wishlisted full product objects
  const wishlistedProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(p.id));
  }, [allProducts, wishlist]);

  // ⚡ Grocery Module (10-15 Min Daily Essentials)
  const groceryProducts = useMemo(() => {
    const items = allProducts.filter((p) =>
      ["Grocery", "Dairy, Bread & Eggs", "Farm Fresh", "Snacks & Munchies", "Instant Food", "Beverages"].includes(p.category)
    );
    return items.length > 0 ? items : allProducts.slice(0, 12);
  }, [allProducts]);

  // 🍽️ Food Module (30-45 Min Fresh Food, Street Food & Cafes)
  const foodProducts = useMemo(() => {
    const items = allProducts.filter((p) =>
      ["Food & Drinks", "Street Food", "Bakery"].includes(p.category)
    );
    return items.length > 0 ? items : allProducts.filter((p) => p.name.includes("Pizza") || p.name.includes("Samosa"));
  }, [allProducts]);

  // 📦 Marketplace Module (Pan-India / Scheduled Delivery: Fashion, Electronics, Art)
  const marketplaceProducts = useMemo(() => {
    const items = allProducts.filter((p) =>
      ["Fashion", "Electronics", "Art & Craft", "Home & Kitchen", "Accessories"].includes(p.category)
    );
    return items.length > 0 ? items : allProducts.filter((p) => p.category === "Fashion" || p.category === "Electronics");
  }, [allProducts]);

  const isPanIndiaMode = (currentLocality || "").toLowerCase().includes("pan-india");

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-[#2D2319] selection:bg-[#EAF7EE] selection:text-[#078B35]">
      {/* ── Top Announcement Bar ──────────────────────────────────── */}
      <AnnouncementBar
        currentLocality={currentLocality}
        onOpenLocation={() => setIsLocationOpen(true)}
      />

      {/* ── Top Header ────────────────────────────────────────────── */}
      <Header
        currentLocality={currentLocality}
        onSelectLocation={handleLocalityChange}
        isLocationOpen={isLocationOpen}
        onOpenLocation={() => setIsLocationOpen(true)}
        onCloseLocation={handleCloseLocation}
        products={allProducts}
        wishlistCount={wishlist.length}
        wishlistedProducts={wishlistedProducts}
        onRemoveFromWishlist={toggleWishlist}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => setSelectedProductForModal(p)}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        isSignInOpen={isSignInOpen}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onCloseSignIn={() => setIsSignInOpen(false)}
        onNavigateOrders={() => {
          if (typeof window !== "undefined") window.location.href = "/account?tab=orders";
        }}
        onNavigateOffers={() => {
          setActiveTab("offers");
          setSelectedCategory(null);
          setActiveStorefrontShop(null);
        }}
        onNavigateStores={() => {
          setActiveTab("stores");
          setSelectedCategory(null);
          setActiveStorefrontShop(null);
        }}
        onNavigateProfile={() => {
          if (typeof window !== "undefined") window.location.href = "/account?tab=profile";
        }}
        onOpenWallet={() => {
          if (typeof window !== "undefined") window.location.href = "/account?tab=wallet";
        }}
        onOpenSupport={() => setIsSupportOpen(true)}
        onNavigateSettings={() => {
          if (typeof window !== "undefined") window.location.href = "/account?tab=privacy";
        }}
      />

      {/* ── Body: Sidebar + Main Content ──────────────────────────── */}
      <div className="flex-1 w-full flex">
        {/* Left Sticky Sidebar */}
        <Sidebar
          activeTab={activeTab}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setActiveStorefrontShop(null);
          }}
          onTabChange={(tab) => {
            if (tab === "wallet") {
              setIsWalletOpen(true);
              return;
            }
            if (tab === "support") {
              setIsSupportOpen(true);
              return;
            }
            setActiveTab(tab);
            setSelectedCategory(null);
            setActiveStorefrontShop(null);
          }}
          onExploreStores={() => setActiveTab("stores")}
          ordersCount={activeOrder ? 1 : 0}
          walletBalance={user?.wallet_balance || user?.servo_coins || 150}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-8 pb-24">
          
          {/* 1. Blinkit-Style Split View Storefront (Triggered on Category or Shop click) */}
          {(selectedCategory || activeStorefrontShop) && (
            <BlinkitSplitViewStorefront
              categoryName={selectedCategory}
              shopName={activeStorefrontShop?.name}
              shopId={activeStorefrontShop?.id}
              allProducts={allProducts}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onClose={() => {
                setSelectedCategory(null);
                setActiveStorefrontShop(null);
              }}
              onSelectShop={(name, id) => {
                setActiveStorefrontShop({ name, id });
                setSelectedCategory(null);
              }}
              onSelectProduct={(prod) => setSelectedProductForModal(prod as ProductItem)}
            />
          )}

          {/* 2. Default Home View */}
          {activeTab === "home" && !selectedCategory && !activeStorefrontShop && (
            <>
              {/* Pan-India Delivery Notification Banner */}
              {isPanIndiaMode && (
                <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#0C831F]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0C831F] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-xl">📦</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#075C2A]">
                        Pan-India Delivery Active for {currentLocality.replace("(Pan-India)", "").trim()}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Instant 10-Min grocery is coming soon to your pin code! Verified Pan-India stores deliver via express courier across all India.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocationOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#0C831F] text-[#0C831F] text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                  >
                    Change Location
                  </button>
                </div>
              )}

              {/* 1. Hero Banner Carousel */}
              <HeroBanner
                onShopNow={() => {
                  setActiveTab("grocery");
                }}
              />

              {/* 2. Choose Delivery Mode That Suits You (In Minutes, In 1 Day, Pan India) */}
              <DeliveryModesStrip
                activeMode={activeDeliveryMode}
                onSelectMode={(mode) => setActiveDeliveryMode(mode)}
              />

              {/* 3. Shop by Category with 3D Icons */}
              <CategoriesSection
                onSelectCategory={(categoryName) => setSelectedCategory(categoryName)}
                onViewAll={() => setActiveTab("grocery")}
              />

              {/* 4. Three Promotional Banners (Daily Essentials, Food Fiesta, Electronics Deals) */}
              <PromoBannersSection
                onSelectCategory={(categoryName) => setSelectedCategory(categoryName)}
              />

              {/* 5. Popular Local Shops Near Locality (Direct from Live Database) */}
              <PopularShopsSection
                currentLocality={currentLocality}
                shops={currentShops}
                onSelectShop={(name, id) => {
                  setActiveStorefrontShop({ name, id });
                }}
                onViewAll={() => setActiveTab("stores")}
              />

              {/* 6. Trending Near You Products (Direct from Live Database) */}
              <TrendingProductsSection
                title="Trending Near You"
                subtitle="Fast-selling essentials delivered in minutes from verified stores"
                products={allProducts}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onClickProduct={(product) => setSelectedProductForModal(product)}
                onViewAll={() => setActiveTab("grocery")}
                limit={12}
              />

              {/* 6B. Cold Drinks & Refreshing Beverages Shelf */}
              {softDrinksShelf.length > 0 && (
                <TrendingProductsSection
                  title="Cold Drinks & Refreshments"
                  subtitle="Chilled colas, soda, natural juices & energy cans"
                  products={softDrinksShelf}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onClickProduct={(product) => setSelectedProductForModal(product)}
                  onViewAll={() => setSelectedCategory("Cold Drinks & Juices")}
                  limit={12}
                />
              )}

              {/* 6C. Dairy, Milk & Morning Staples Shelf */}
              {dailyDairyProducts.length > 0 && (
                <TrendingProductsSection
                  title="Daily Dairy, Bread & Eggs"
                  subtitle="Farm-fresh milk pouches, curd, butter & whole wheat bread"
                  products={dailyDairyProducts}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onClickProduct={(product) => setSelectedProductForModal(product)}
                  onViewAll={() => setSelectedCategory("Dairy, Bread & Eggs")}
                  limit={12}
                />
              )}

              {/* 6D. Chips, Crisps & Namkeen Shelf */}
              {snacksAndMunchiesProducts.length > 0 && (
                <TrendingProductsSection
                  title="Chips, Crisps & Munchies"
                  subtitle="Crispy salted chips, masala munchies & classic namkeen"
                  products={snacksAndMunchiesProducts}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onClickProduct={(product) => setSelectedProductForModal(product)}
                  onViewAll={() => setSelectedCategory("Snacks & Munchies")}
                  limit={12}
                />
              )}

              {/* 6E. Instant Food & Kitchen Staples Shelf */}
              {staplesShelf.length > 0 && (
                <TrendingProductsSection
                  title="Instant Food, Noodles & Staples"
                  subtitle="2-Minute noodles, pure chakki atta, basmati rice & iodized salt"
                  products={staplesShelf}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onClickProduct={(product) => setSelectedProductForModal(product)}
                  onViewAll={() => setSelectedCategory("Atta, Rice & Staples")}
                  limit={12}
                />
              )}

              {/* 6F. Pharmacy & Daily Care Shelf */}
              {careShelf.length > 0 && (
                <TrendingProductsSection
                  title="Pharmacy & Daily Hygiene"
                  subtitle="Antiseptic soaps, handwash refills, paracetamol & detergents"
                  products={careShelf}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onClickProduct={(product) => setSelectedProductForModal(product)}
                  onViewAll={() => setSelectedCategory("Pharmacy")}
                  limit={12}
                />
              )}

              {/* 7. Why Shop on ServoLocal? (5 Benefits Strip) */}
              <BenefitsStrip />

              {/* 8. How ServoLocal Works? (4 Steps) */}
              <HowItWorksSection />

              {/* 9. ServoLocal App Coming Soon Banner */}
              <AppPromoBanner />
            </>
          )}

          {/* 3. Grocery Tab (⚡ 10-15 Min Quick Delivery) */}
          {activeTab === "grocery" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#EAF7EE] to-emerald-50 border border-[#078B35]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">
                      Grocery &amp; Daily Essentials
                    </h2>
                  </div>
                  <p className="text-xs text-[#666666] max-w-xl">
                    Delivered in 10-15 minutes from neighbourhood dark stores and local kirana partners in {currentLocality}.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-[#078B35] text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs">
                  ⚡ 10-15 Min Instant Delivery
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {groceryProducts.map((product) => {
                  const cartItem = cart.find((item) => item.inventory_id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      cartQuantity={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateCartQuantity={handleUpdateCartQuantity}
                      onClickProduct={(p) => setSelectedProductForModal(p)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Food & Street Stalls Tab (🍽️ 30-45 Min Scheduled) */}
          {activeTab === "food" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍽️</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">
                      Food, Cafes &amp; Street Stalls
                    </h2>
                  </div>
                  <p className="text-xs text-[#666666] max-w-xl">
                    Freshly made pizzas, snacks, sweets, samosas, and chai from local kitchens, street vendors &amp; eateries.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs">
                  🍽️ Freshly Prepared (30-45 Mins)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {foodProducts.map((product) => {
                  const cartItem = cart.find((item) => item.inventory_id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      cartQuantity={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateCartQuantity={handleUpdateCartQuantity}
                      onClickProduct={(p) => setSelectedProductForModal(p)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Marketplace Tab (📦 Pan-India Courier & Scheduled Delivery) */}
          {activeTab === "marketplace" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">
                      Marketplace &amp; Pan-India
                    </h2>
                  </div>
                  <p className="text-xs text-[#666666] max-w-xl">
                    Fashion, electronics, local boutique collections, artworks &amp; home essentials delivered via express courier across all India.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs">
                  📦 Express Courier Delivery (2-4 Days)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {marketplaceProducts.map((product) => {
                  const cartItem = cart.find((item) => item.inventory_id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      cartQuantity={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateCartQuantity={handleUpdateCartQuantity}
                      onClickProduct={(p) => setSelectedProductForModal(p)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Nearby Stores Tab (With Live Open / Closed Badges & Filters) */}
          {activeTab === "stores" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              {/* Header Banner & Title */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#EAF7EE] via-emerald-50 to-[#FDFBF7] border border-[#078B35]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏪</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717]">
                      Verified Local Stores in {currentLocality || "Your Area"}
                    </h2>
                  </div>
                  <p className="text-xs text-[#666666] max-w-xl">
                    Discover neighbourhood kirana stores, fresh dairies, eateries, and specialty sellers. Check live open/closed status and order with 10-15 minute delivery.
                  </p>
                </div>

                {/* In-tab Store Search */}
                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    placeholder="Search stores, kirana, dairy..."
                    className="w-full bg-white border border-[#E8ECE9] rounded-xl pl-9 pr-7 py-2 text-xs text-[#171717] placeholder:text-gray-400 focus:outline-none focus:border-[#078B35] shadow-2xs"
                  />
                  {storeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStoreSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Pills: All / Open / Closed */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setStoreStatusFilter("ALL")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    storeStatusFilter === "ALL"
                      ? "bg-[#2D2319] text-white shadow-xs"
                      : "bg-white text-[#4A3B32] border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  All Stores ({currentShops.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStoreStatusFilter("OPEN")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    storeStatusFilter === "OPEN"
                      ? "bg-[#078B35] text-white shadow-xs"
                      : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Open Now ({openStoresCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreStatusFilter("CLOSED")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    storeStatusFilter === "CLOSED"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Closed Now ({closedStoresCount})</span>
                </button>
              </div>

              {/* Stores Grid */}
              {filteredStoresList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#E8ECE9] space-y-3">
                  <Store className="w-12 h-12 mx-auto text-gray-300 stroke-1" />
                  <h4 className="text-sm font-bold text-gray-700">No stores match your filter</h4>
                  <p className="text-xs text-gray-500">Try changing your search term or clear the filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreStatusFilter("ALL");
                      setStoreSearchQuery("");
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 sm:gap-6">
                  {filteredStoresList.map((shop) => {
                    const isOpen = shop.is_open !== false;
                    return (
                      <div
                        key={shop.id}
                        className={`p-4 rounded-3xl border bg-white transition-all flex flex-col justify-between group space-y-3.5 shadow-2xs hover:shadow-lg ${
                          isOpen
                            ? "border-[#E8ECE9] hover:border-[#078B35]/50"
                            : "border-gray-200/80 bg-gray-50/50 opacity-90"
                        }`}
                      >
                        {/* Store Image with Badges */}
                        <div className="h-40 rounded-2xl overflow-hidden bg-slate-100 relative">
                          <img
                            src={shop.image_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80"}
                            alt={shop.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              isOpen ? "group-hover:scale-105" : "grayscale-[30%]"
                            }`}
                          />

                          {/* Live Open / Closed Badge */}
                          <div className="absolute top-2.5 left-2.5 z-10">
                            {isOpen ? (
                              <span className="px-2.5 py-1 rounded-full bg-white/95 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm border border-emerald-300/80">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Open Now</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-gray-900/90 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                <span>Closed</span>
                              </span>
                            )}
                          </div>

                          {/* Top-Right Rating Badge */}
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-white/95 text-[#171717] text-[11px] font-bold shadow-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{shop.rating || 4.8}</span>
                          </span>

                          {/* Bottom-Left ETA Badge */}
                          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#078B35] text-white text-[10px] font-bold shadow-xs">
                            {shop.local_eta_mins || "⚡ 10-15m"}
                          </span>
                        </div>

                        {/* Store Info */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="text-sm sm:text-base font-extrabold text-[#171717] group-hover:text-[#078B35] transition-colors truncate">
                              {shop.name}
                            </h4>
                          </div>

                          <p className="text-xs text-gray-600 font-medium">{shop.category}</p>
                          <p className="text-[11px] text-gray-500">
                            {shop.locality_name || currentLocality} • {shop.distance_km || 1} km away
                          </p>

                          {/* Timing / Status Banner */}
                          <div className={`mt-2 p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                            isOpen
                              ? "bg-emerald-50/70 text-emerald-900 border border-emerald-100"
                              : "bg-rose-50 text-rose-800 border border-rose-100"
                          }`}>
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isOpen ? "text-emerald-700" : "text-rose-600"}`} />
                            <span className="truncate">{shop.timing_info || (isOpen ? "Open for 10-15 min delivery" : "Opens soon")}</span>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#078B35] truncate">
                            {shop.free_delivery_enabled ? "Free Delivery" : "Fast delivery"}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveStorefrontShop({ name: shop.name, id: shop.id });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                              isOpen
                                ? "bg-[#078B35] hover:bg-[#075C2A] text-white hover:scale-102"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            <span>{isOpen ? "Enter Store Aisles" : "View Catalog"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 5. Orders Tab */}
          {activeTab === "orders" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#171717]">My Orders</h2>
                <p className="text-xs text-[#666666]">
                  Track and review your recent neighbourhood deliveries
                </p>
              </div>

              {activeOrder ? (
                <div className="p-6 rounded-3xl bg-[#EAF7EE] border border-[#078B35]/25 max-w-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#075C2A]">
                      Active Order #{activeOrder.orderCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#078B35] text-white text-[10px] font-bold">
                      {activeOrder.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#171717]">
                    From {activeOrder.shopName}
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Delivering to {activeOrder.deliveryAddress}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveOrder(activeOrder)}
                      className="w-full py-2.5 rounded-xl bg-[#078B35] text-white text-xs font-bold hover:bg-[#075C2A] cursor-pointer"
                    >
                      Open Live Tracker & PIN
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="py-12 text-center space-y-3 bg-[#F8F9FA] rounded-3xl border border-[#E8ECE9]">
                    <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                    <h3 className="text-sm font-bold text-[#171717]">No active orders right now</h3>
                    <p className="text-xs text-[#666666] max-w-sm mx-auto">
                      When you place an order with your local store, live 10-15 min tracking will appear right here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("home")}
                      className="px-5 py-2 rounded-xl bg-[#078B35] text-white text-xs font-bold hover:bg-[#075C2A] transition-colors cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>

                  {/* Discover Local Stores to Order From */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-[#171717]">
                          Order from Verified Local Stores
                        </h3>
                        <p className="text-xs text-[#666666]">
                          Check open stores near {currentLocality || "Your Area"} for superfast 10-15 min delivery
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("stores")}
                        className="text-xs font-bold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
                      >
                        <span>View All Stores ({currentShops.length})</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {currentShops.slice(0, 4).map((shop) => {
                        const isOpen = shop.is_open !== false;
                        return (
                          <div
                            key={shop.id}
                            className="p-4 rounded-3xl border border-[#E8ECE9] bg-white hover:border-[#078B35]/40 hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                          >
                            <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                              <img
                                src={shop.image_url}
                                alt={shop.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2 z-10">
                                {isOpen ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 shadow-xs border border-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Open Now</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-gray-900/90 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <span>Closed</span>
                                  </span>
                                )}
                              </div>
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/95 text-[#171717] text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{shop.rating}</span>
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-[#171717] truncate">{shop.name}</h4>
                              <p className="text-xs text-[#666666]">{shop.category}</p>
                              <p className="text-[11px] text-[#666666]">{shop.locality_name} • {shop.distance_km} km away</p>
                            </div>

                            <div className="pt-2 border-t border-[#E8ECE9] flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-[#078B35]">
                                {shop.free_delivery_enabled ? "Free Delivery" : "Fast delivery"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveStorefrontShop({ name: shop.name, id: shop.id });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-[#EAF7EE] text-[#078B35] hover:bg-[#078B35] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                Browse Store →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 6. Offers Tab */}
          {activeTab === "offers" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#171717]">Special Offers & Deals</h2>
                <p className="text-xs text-[#666666]">
                  Exclusive neighbourhood coupons and free delivery thresholds
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EAF7EE] to-white border border-[#078B35]/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#078B35]" />
                    <span className="text-sm font-bold text-[#075C2A]">COUPON: FREEDEL</span>
                  </div>
                  <h4 className="text-base font-bold text-[#171717]">
                    100% Free Delivery above ₹150
                  </h4>
                  <p className="text-xs text-[#666666]">
                    Order groceries, dairy, snacks or pharmacy products and get free doorstep delivery in 10-15 minutes.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("home")}
                      className="px-4 py-1.5 rounded-xl bg-[#078B35] text-white text-xs font-bold cursor-pointer"
                    >
                      Shop Now
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">COUPON: LOCALFAST</span>
                  </div>
                  <h4 className="text-base font-bold text-[#171717]">
                    Flat ₹50 Off on Food & Drinks above ₹249
                  </h4>
                  <p className="text-xs text-[#666666]">
                    Valid on Pizza Margherita, burgers, sweets and snacks from verified local eateries.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Food & Drinks");
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer hover:bg-amber-700"
                    >
                      Browse Food
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 7. Full My Profile View (Neon PostgreSQL & Render API Connected) */}
          {activeTab === "profile" && !selectedCategory && !activeStorefrontShop && (
            <CustomerProfileView
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
              onNavigateHome={() => setActiveTab("home")}
              onNavigateOrders={() => {
                setActiveTab("orders");
                setSelectedCategory(null);
                setActiveStorefrontShop(null);
              }}
              onOpenAddresses={() => setIsLocationOpen(true)}
              onOpenWishlist={() => {}}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenNotifications={() => {}}
              onOpenSupport={() => setIsSupportOpen(true)}
              onOpenEditModal={() => {}}
              wishlistCount={wishlist.length}
            />
          )}

          {/* 8. Full Account Settings View */}
          {activeTab === "settings" && !selectedCategory && !activeStorefrontShop && (
            <AccountSettingsView
              user={user}
              onNavigateHome={() => setActiveTab("home")}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* ── Signature Blinkit Floating Bottom Cart Bar ────────────── */}
      <FloatingCartBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        currentLocality={currentLocality || "Your Area"}
      />

      {/* ── Slide-Out Cart Drawer ─────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        currentLocality={currentLocality || "Your Area"}
        user={user}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* ── Live 10-15 Min Order Tracker Modal ────────────────────── */}
      {activeOrder && (
        <LiveOrderTrackerAndReview
          order={activeOrder}
          onClose={handleCloseActiveOrder}
        />
      )}

      {/* ── Product Details Modal ──────────────────────────────────── */}
      <ProductDetailsModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        currentLocality={currentLocality}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        isWishlisted={selectedProductForModal ? wishlist.includes(selectedProductForModal.id) : false}
        onToggleWishlist={toggleWishlist}
      />

      {/* ── ServoCoins Wallet Modal ────────────────────────────────── */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        user={user}
      />

      {/* ── Help & Support Modal ──────────────────────────────────── */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* ── Mobile Responsive Bottom Navigation Bar ────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8ECE9] flex items-center justify-around py-2 px-1 shadow-lg select-none">
        {[
          { id: "home" as SidebarTab, label: "Home", icon: Home },
          { id: "stores" as SidebarTab, label: "Stores", icon: Store },
          { id: "grocery" as SidebarTab, label: "Grocery", icon: Zap },
          { id: "food" as SidebarTab, label: "Food", icon: Utensils },
          { id: "orders" as SidebarTab, label: "Orders", icon: ShoppingBag, badge: activeOrder ? 1 : 0 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setSelectedCategory(null);
                setActiveStorefrontShop(null);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? "text-[#078B35] font-bold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-[#078B35]" : "text-gray-500"}`} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Global Footer ─────────────────────────────────────────── */}
      <Footer
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
          setSelectedCategory(null);
          setActiveStorefrontShop(null);
        }}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenLocation={() => setIsLocationOpen(true)}
      />
    </div>
  );
}
