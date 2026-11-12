"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Store, Tag, ShoppingBag, Zap, Utensils, Package, Coins, HelpCircle, Truck, Clock } from "lucide-react";

import Header from "@/components/Header";
import Sidebar, { SidebarTab } from "@/components/Sidebar";
import HeroBanner from "@/components/HeroBanner";
import CategoryCard, { CATEGORIES_DATA } from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import BlinkitSplitViewStorefront from "@/components/BlinkitSplitViewStorefront";
import LiveOrderTrackerAndReview, { ActiveOrderData } from "@/components/LiveOrderTrackerAndReview";
import FloatingCartBar from "@/components/FloatingCartBar";
import ProductDetailsModal from "@/components/ProductDetailsModal";
import WalletModal from "@/components/WalletModal";
import SupportModal from "@/components/SupportModal";

import { ProductItem, CartItem, UserProfile, CategoryItem } from "@/types";
import { MASTER_PRODUCTS, MASTER_SHOPS } from "@/lib/masterCatalogData";

export default function CustomerHomePage() {
  // ── 1. Locality & GPS State ───────────────────────────────────────────────
  const [currentLocality, setCurrentLocality] = useState<string>("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [, setCurrentLat] = useState(27.0544);
  const [, setCurrentLng] = useState(75.8942);

  // ── 2. Navigation & View State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SidebarTab>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeStorefrontShop, setActiveStorefrontShop] = useState<{
    name: string;
    id?: number;
  } | null>(null);

  // ── 3. Modals & Detail Views ──────────────────────────────────────────────
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // ── 4. User Session State ─────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // ── 4. Cart & Drawer State ────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── 5. Active Order State (Live 10-15 Min Tracking) ───────────────────────
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);

  // ── 6. Wishlist State (Persisted) ─────────────────────────────────────────
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

        const savedOrder = localStorage.getItem("servo_active_order");
        if (savedOrder) setActiveOrder(JSON.parse(savedOrder));
      } catch {}
    }
  }, []);

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
    if (!currentLocality) {
      setCurrentLocality("Kukas, Jaipur");
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_locality", "Kukas, Jaipur");
      }
    }
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

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.inventory_id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.inventory_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [
          ...prev,
          {
            inventory_id: product.id,
            name: product.name,
            image_url: product.image_url,
            price: product.selling_price,
            mrp: product.mrp,
            quantity: 1,
            shop_id: product.shop_id || 1,
            shop_name: product.shop_name,
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

  // Convert Master Products to ProductItem
  const allProducts: ProductItem[] = useMemo(() => {
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
  }, []);

  // 4 Showcase Products with Real High-Definition Images
  const popularNearYouProducts: ProductItem[] = useMemo(() => {
    const popularIds = [9001, 9002, 9003, 9004];
    const items = allProducts.filter((p) => popularIds.includes(p.id));
    return items.sort((a, b) => popularIds.indexOf(a.id) - popularIds.indexOf(b.id));
  }, [allProducts]);

  // Real Dairy & Morning Staples Shelf
  const dailyDairyProducts: ProductItem[] = useMemo(() => {
    const dairyIds = [102, 101, 104, 103];
    const items = allProducts.filter((p) => dairyIds.includes(p.id));
    return items.sort((a, b) => dairyIds.indexOf(a.id) - dairyIds.indexOf(b.id));
  }, [allProducts]);

  // Real Snacks, Drinks & Quick Munchies Shelf
  const snacksAndMunchiesProducts: ProductItem[] = useMemo(() => {
    const snackIds = [201, 501, 401, 301];
    const items = allProducts.filter((p) => snackIds.includes(p.id));
    return items.sort((a, b) => snackIds.indexOf(a.id) - snackIds.indexOf(b.id));
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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans text-[#171717] selection:bg-[#EAF7EE] selection:text-[#078B35]">
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
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        isSignInOpen={isSignInOpen}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onCloseSignIn={() => setIsSignInOpen(false)}
        onNavigateOrders={() => setActiveTab("orders")}
      />

      {/* ── Body: Sidebar + Main Content ──────────────────────────── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex">
        {/* Left Sticky Sidebar */}
        <Sidebar
          activeTab={activeTab}
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
          ordersCount={activeOrder ? 1 : 0}
          walletBalance={user?.wallet_balance || user?.servo_coins || 150}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 space-y-8 pb-24">
          
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
                      handleLocalityChange("Kukas, Jaipur", 27.0544, 75.8942);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#0C831F] text-[#0C831F] text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                  >
                    Switch to Kukas / Jaipur (10-Min)
                  </button>
                </div>
              )}

              {/* Hero Banner */}
              <HeroBanner
                onExploreStores={() => {
                  setActiveTab("stores");
                }}
              />

              {/* Shop by Category Section */}
              <section className="space-y-3.5 select-none">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-[#171717]">
                    Shop by Category
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("grocery")}
                    className="text-xs font-semibold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>See All Categories</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {CATEGORIES_DATA.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      isSelected={selectedCategory === cat.name}
                      onClick={(c: CategoryItem) => setSelectedCategory(c.name)}
                    />
                  ))}
                </div>
              </section>

              {/* Popular Near You Section (4 Showcase Cards) */}
              <section className="space-y-3.5 select-none">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-[#171717]">
                    Popular Near You
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("grocery")}
                    className="text-xs font-semibold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>See All</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popularNearYouProducts.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.inventory_id === product.id
                    );
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

              {/* Real Dairy, Bread & Morning Essentials Shelf */}
              <section className="space-y-3.5 select-none pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥛</span>
                    <h2 className="text-xl font-bold tracking-tight text-[#171717]">
                      Dairy, Bread &amp; Fresh Milk
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("Dairy, Bread & Eggs")}
                    className="text-xs font-semibold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>Explore Dairy</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dailyDairyProducts.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.inventory_id === product.id
                    );
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

              {/* Real Snacks, Munchies & Cold Drinks Shelf */}
              <section className="space-y-3.5 select-none pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍟</span>
                    <h2 className="text-xl font-bold tracking-tight text-[#171717]">
                      Snacks, Munchies &amp; Cold Drinks
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("Snacks & Munchies")}
                    className="text-xs font-semibold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>Explore Snacks</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {snacksAndMunchiesProducts.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.inventory_id === product.id
                    );
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* 4. Nearby Stores Tab */}
          {activeTab === "stores" && !selectedCategory && !activeStorefrontShop && (
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#171717]">
                  Nearby Local Stores in {currentLocality}
                </h2>
                <p className="text-xs text-[#666666]">
                  Real neighbourhood kirana, bakeries, street stalls and specialty shops
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {MASTER_SHOPS.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-4 rounded-2xl border border-[#E8ECE9] bg-white hover:border-[#078B35]/40 hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div className="h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src={shop.image_url}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#078B35] text-white text-[10px] font-bold">
                        {shop.local_eta_mins}
                      </span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#FFF4CE] text-[#171717] text-[10px] font-bold">
                        ★ {shop.rating}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#078B35]" />
                        <h4 className="text-sm font-bold text-[#171717] truncate">
                          {shop.name}
                        </h4>
                      </div>
                      <p className="text-xs text-[#666666]">{shop.category}</p>
                      <p className="text-[11px] text-[#666666]">
                        {shop.locality_name} • {shop.distance_km} km away
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E8ECE9] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#078B35]">
                        {shop.free_delivery_enabled ? "Free Delivery eligible" : "Flat delivery fee"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStorefrontShop({ name: shop.name, id: shop.id });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#EAF7EE] text-[#078B35] hover:bg-[#078B35] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Enter Shop Aisles →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="py-16 text-center space-y-3 bg-[#F8F9FA] rounded-3xl border border-[#E8ECE9]">
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
        </main>
      </div>

      {/* ── Signature Blinkit Floating Bottom Cart Bar ────────────── */}
      <FloatingCartBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        currentLocality={currentLocality || "Kukas, Jaipur"}
      />

      {/* ── Slide-Out Cart Drawer ─────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        currentLocality={currentLocality || "Kukas, Jaipur"}
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
        cartQuantity={
          selectedProductForModal
            ? cart.find((i) => i.inventory_id === selectedProductForModal.id)?.quantity || 0
            : 0
        }
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
          { id: "home" as SidebarTab, label: "Home", icon: Store },
          { id: "grocery" as SidebarTab, label: "Grocery", icon: Zap },
          { id: "food" as SidebarTab, label: "Food", icon: Utensils },
          { id: "marketplace" as SidebarTab, label: "Mall", icon: Package },
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
    </div>
  );
}
