"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Heart,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Store,
  ChevronRight,
  Clock,
  ArrowLeft,
  Check,
  Share2,
  Sparkles,
  ShoppingBag,
  Zap,
  MapPin,
  Tag,
  Info,
  ShieldAlert,
} from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import SignInModal from "@/components/SignInModal";
import { ProductItem, CartItem, UserProfile } from "@/types";
import { MASTER_PRODUCTS } from "@/lib/masterCatalogData";
import { getProductDetails, getProductOffers, getDiscoveryFeed, getAppConfig } from "@/lib/api";

export interface SellerOffer {
  inventory_id: number;
  shop_id: number;
  shop_name: string;
  shop_category?: string;
  shop_rating?: number;
  is_verified?: boolean;
  locality_name?: string;
  distance_km: number;
  selling_price: number;
  mrp: number;
  discount_percent: number;
  available_stock: number;
  in_stock: boolean;
  delivery_mode?: string;
  fulfillment_time_slot?: string;
  free_delivery_enabled?: boolean;
}

export default function DedicatedProductPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const productId = Number(rawId) || 101;

  // ── States ────────────────────────────────────────────────────────────────
  const [product, setProduct] = useState<any>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0);
  const [sellerOffers, setSellerOffers] = useState<SellerOffer[]>([]);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [offerFilter, setOfferFilter] = useState<"CHEAPEST" | "FASTEST" | "NEAREST">("CHEAPEST");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentLocality, setCurrentLocality] = useState("");
  const [tickerText, setTickerText] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<ProductItem[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Load User & Local Storage State ───────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("servo_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem("servo_wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

        const savedUser = localStorage.getItem("servo_user");
        if (savedUser) setUser(JSON.parse(savedUser));

        const savedLocality = localStorage.getItem("servo_locality");
        if (savedLocality) setCurrentLocality(savedLocality);
      } catch {}
    }

    getAppConfig()
      .then((cfg) => {
        if (cfg?.ticker_text) setTickerText(cfg.ticker_text);
      })
      .catch(() => {});
  }, []);

  // ── Fetch Product Details, Multi-Store Offers & Similar Items ─────────────
  useEffect(() => {
    let isMounted = true;

    // 1. Find product in catalog or API
    const localMatch = MASTER_PRODUCTS.find((p) => p.id === productId);
    if (localMatch) {
      setProduct(localMatch);
      const initialImages = [
        localMatch.image_url,
        ...(localMatch.gallery_images || []),
      ].filter(Boolean);
      setGallery(initialImages.length > 0 ? initialImages : [localMatch.image_url]);
    }

    // 2. Fetch live details from backend
    getProductDetails(productId)
      .then((data) => {
        if (!isMounted || !data) return;
        setProduct((prev: any) => ({ ...(prev || {}), ...data }));
        if (data.gallery_images && data.gallery_images.length > 0) {
          const urls = data.gallery_images.map((g: any) => (typeof g === "string" ? g : g.url));
          setGallery(urls);
        }
      })
      .catch(() => {});

    // 3. Fetch live seller comparison offers
    getProductOffers(productId)
      .then((res) => {
        if (!isMounted || !res?.offers) return;
        setSellerOffers(res.offers);
      })
      .catch(() => {
        if (isMounted && localMatch) {
          setSellerOffers([
            {
              inventory_id: localMatch.id,
              shop_id: localMatch.shop_id || 1,
              shop_name: localMatch.shop_name || "Verified Local Store",
              locality_name: localMatch.shop_locality || currentLocality || "Nearby Local Store",
              distance_km: 1.2,
              selling_price: localMatch.selling_price,
              mrp: localMatch.mrp,
              discount_percent: localMatch.discount_percent || 0,
              available_stock: 50,
              in_stock: true,
              fulfillment_time_slot: localMatch.local_eta_mins || "⚡ 10-15 Mins",
            },
          ]);
        }
      });

    // 4. Fetch similar items in same category
    if (localMatch) {
      const similars = MASTER_PRODUCTS.filter(
        (p) => p.category === localMatch.category && p.id !== localMatch.id
      ).slice(0, 8);
      setSimilarProducts(similars as any);
    }

    return () => {
      isMounted = false;
    };
  }, [productId, currentLocality]);

  // ── Active Selected Seller Offer ──────────────────────────────────────────
  const sortedOffers = useMemo(() => {
    if (!sellerOffers || sellerOffers.length === 0) return [];
    const list = [...sellerOffers];
    if (offerFilter === "CHEAPEST") {
      return list.sort((a, b) => a.selling_price - b.selling_price);
    } else if (offerFilter === "FASTEST") {
      return list.sort((a, b) => (a.distance_km || 1) - (b.distance_km || 1));
    } else {
      return list.sort((a, b) => (a.distance_km || 1) - (b.distance_km || 1));
    }
  }, [sellerOffers, offerFilter]);

  const activeOffer: SellerOffer | null = sortedOffers[selectedOfferIndex] || sortedOffers[0] || null;

  // ── Pricing & Unit ────────────────────────────────────────────────────────
  const unitOptions = useMemo(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map((v: any) => ({
        id: v.id,
        label: v.weight_or_size,
        price: v.price,
        mrp: v.mrp,
        discountPct: v.discount_pct,
      }));
    }
    const weightLabel = product?.default_weight_or_size || product?.unit || "1 unit";
    const currentPrice = activeOffer?.selling_price || product?.selling_price || 0;
    const currentMrp = activeOffer?.mrp || product?.mrp || currentPrice;
    return [
      {
        id: "default",
        label: weightLabel,
        price: currentPrice,
        mrp: currentMrp,
        discountPct: currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0,
      },
    ];
  }, [product, activeOffer]);

  const currentUnit = unitOptions[selectedUnitIdx] || unitOptions[0];
  const activePrice = currentUnit?.price || activeOffer?.selling_price || product?.selling_price || 0;
  const activeMrp = currentUnit?.mrp || activeOffer?.mrp || product?.mrp || activePrice;
  const activeDiscountPct = activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;

  // ── Cart Operations ───────────────────────────────────────────────────────
  const activeInventoryId = activeOffer?.inventory_id || product?.id || productId;
  const cartItem = cart.find((item) => item.inventory_id === activeInventoryId);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (!product) return;
    if ((product as any)?.is_18_plus && user?.is_18_plus === false) {
      alert("This item is strictly restricted to customers aged 18 and older.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.inventory_id === activeInventoryId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.inventory_id === activeInventoryId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [
          ...prev,
          {
            inventory_id: activeInventoryId,
            name: product.name,
            image_url: gallery[0] || product.image_url,
            price: activePrice,
            mrp: activeMrp,
            quantity: 1,
            unit: currentUnit?.label,
            shop_id: activeOffer?.shop_id || product.shop_id || 1,
            shop_name: activeOffer?.shop_name || product.shop_name || "Verified Local Store",
          },
        ];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_cart", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleUpdateCartQuantity = (qty: number) => {
    setCart((prev) => {
      let updated: CartItem[];
      if (qty <= 0) {
        updated = prev.filter((item) => item.inventory_id !== activeInventoryId);
      } else {
        updated = prev.map((item) =>
          item.inventory_id === activeInventoryId ? { ...item, quantity: qty } : item
        );
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_cart", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const toggleWishlist = () => {
    if (!product) return;
    setWishlist((prev) => {
      const exists = prev.includes(product.id);
      const updated = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_wishlist", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
        <AnnouncementBar currentLocality={currentLocality} onOpenLocation={() => setIsLocationOpen(true)} tickerText={tickerText} />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#078B35] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading genuine product details...</p>
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const currentImage = gallery[activeImageIndex] || product.image_url;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-[#2D2319] selection:bg-[#EAF7EE] selection:text-[#078B35]">
      {/* ── Top Bar & Header ─────────────────────────────────────────────── */}
      <AnnouncementBar
        currentLocality={currentLocality}
        onOpenLocation={() => setIsLocationOpen(true)}
        tickerText={tickerText}
      />

      <Header
        currentLocality={currentLocality}
        onSelectLocation={(loc) => setCurrentLocality(loc)}
        isLocationOpen={isLocationOpen}
        onOpenLocation={() => setIsLocationOpen(true)}
        onCloseLocation={() => setIsLocationOpen(false)}
        products={similarProducts}
        wishlistCount={wishlist.length}
        wishlistedProducts={wishlist.map(wId => similarProducts.find(sp => sp.id === wId)).filter(Boolean) as ProductItem[]}
        onRemoveFromWishlist={(wId) => setWishlist(prev => prev.filter(x => x !== wId))}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onAddToCart={(p) => handleAddToCart()}
        onSelectProduct={(p) => router.push(`/product/${encodeURIComponent(p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/${p.id}`)}
        user={user}
        onLoginSuccess={(u) => setUser(u)}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem("servo_token");
          localStorage.removeItem("servo_user");
        }}
        isSignInOpen={isSignInOpen}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onCloseSignIn={() => setIsSignInOpen(false)}
        onNavigateOrders={() => router.push("/account?tab=orders")}
        onNavigateOffers={() => router.push("/#offers")}
        onNavigateStores={() => router.push("/#stores")}
        onNavigateProfile={() => router.push("/account?tab=profile")}
        onNavigateAddresses={() => router.push("/account?tab=addresses")}
        onOpenWishlist={() => router.push("/account?tab=wishlist")}
        onOpenWallet={() => router.push("/account?tab=wallet")}
        onOpenSupport={() => router.push("/account?tab=support")}
        onNavigateSettings={() => router.push("/account?tab=privacy")}
      />

      {/* ── Main Breadcrumb Navigation ────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#8C7663] flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Link href="/" className="hover:text-[#078B35] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <span>/</span>
          <Link href={`/#${product.category?.toLowerCase()}`} className="hover:text-[#078B35] transition-colors truncate">
            {product.category}
          </Link>
          {product.sub_category && (
            <>
              <span>/</span>
              <span className="truncate">{product.sub_category}</span>
            </>
          )}
          <span>/</span>
          <span className="font-bold text-[#2D2319] truncate">{product.name}</span>
        </div>

        <button
          type="button"
          onClick={handleShareLink}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#078B35] transition-colors cursor-pointer shrink-0 ml-2"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? "Link Copied!" : "Share"}</span>
        </button>
      </nav>

      {/* ── Authentic Blinkit-Style Product Layout ────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 flex-1">
        <div className="bg-white rounded-3xl border border-[#E8ECE9] shadow-sm p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ── LEFT COLUMN (55%): Big Product Packshot & Specifications ───── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Stage Image Container */}
            <div className="relative w-full aspect-square max-h-[460px] rounded-3xl bg-white border border-gray-100 p-6 flex items-center justify-center overflow-hidden group">
              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-700 hover:text-rose-500 transition-all cursor-pointer"
              >
                <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-600"}`} />
              </button>

              <img
                src={currentImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Thumbnail Carousel Row */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden p-1.5 bg-white border cursor-pointer transition-all shrink-0 flex items-center justify-center ${
                      activeImageIndex === idx
                        ? "border-[#078B35] ring-2 ring-[#078B35]/20 shadow-xs scale-105"
                        : "border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Details Section (Matching Image 3 Accordion) */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h2 className="text-base font-extrabold text-[#2D2319]">Product Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#4A3B32]">
                <div className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E8ECE9] space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Brand</span>
                  <span className="font-semibold text-[#171717] text-sm">{product.brand || "Authentic Verified"}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E8ECE9] space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Net Quantity</span>
                  <span className="font-semibold text-[#171717] text-sm">{currentUnit?.label || "1 Unit"}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E8ECE9] space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Dietary Preference</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{product.is_veg !== false ? "100% Vegetarian" : "Non-Vegetarian"}</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E8ECE9] space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Delivery Mode</span>
                  <span className="font-semibold text-[#078B35] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{activeOffer?.fulfillment_time_slot || "⚡ 10-15 Min Instant Delivery"}</span>
                  </span>
                </div>
              </div>

              {product.description && (
                <div className="text-xs text-[#6B5E52] leading-relaxed p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Genuine Local Store Guarantee Badge */}
              <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#078B35]/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#078B35] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-[#075C2A]">
                  <strong className="font-bold block">100% Genuine Local Store Guarantee</strong>
                  <p className="leading-snug">
                    Delivered directly from authorized neighborhood shops near {currentLocality || "you"}. Zero counterfeit, original seal &amp; verified MRP billing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (45%): Title, Units, Multi-Store Comparison & Add ── */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              
              {/* Category Breadcrumbs & Veg Indicator */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#078B35] bg-[#EAF7EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>

                {/* Blinkit Veg Square Symbol */}
                <div
                  className="w-4 h-4 rounded-sm border border-emerald-600 flex items-center justify-center shrink-0"
                  title="Vegetarian"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
              </div>

              {/* Product Headline */}
              <div>
                {(product as any).is_18_plus && (
                  <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
                    <span className="text-base">🔞</span>
                    <p className="leading-relaxed">
                      <strong className="font-bold">18+ Age-Restricted Wellness Product:</strong>{" "}
                      This product is restricted to adult customers aged 18 and above in compliance with Indian consumer protection and product safety guidelines.
                    </p>
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight leading-snug">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <div className="px-2 py-0.5 rounded-md bg-[#FFF4CE] text-[#2D2319] font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating || 4.8}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 font-medium">500+ orders fulfilled</span>
                </div>
              </div>

              {/* Select Unit (Matching Image 3) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Select Unit
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {unitOptions.map((u: any, idx: number) => {
                    const isSelected = selectedUnitIdx === idx;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUnitIdx(idx)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "border-2 border-[#078B35] bg-[#EAF7EE] text-[#075C2A] shadow-xs scale-102"
                            : "border border-gray-200 bg-white text-gray-700 hover:border-[#078B35]/60"
                        }`}
                      >
                        <span>{u.label}</span>
                        <span className="font-extrabold text-[#171717]">₹{u.price}</span>
                        {u.discountPct > 0 && (
                          <span className="text-[10px] font-bold text-[#078B35] bg-[#D4F0DD] px-1.5 py-0.5 rounded">
                            {u.discountPct}% OFF
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Price Display & Add To Cart Button */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F2] border border-[#EFECE6] space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#171717]">
                        ₹{activePrice}
                      </span>
                      {activeMrp > activePrice && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            ₹{activeMrp}
                          </span>
                          <span className="text-xs font-bold text-[#078B35] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                            {activeDiscountPct}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 block">
                      (Inclusive of all taxes)
                    </span>
                  </div>

                  {/* Add To Cart Controller */}
                  {(product as any).is_18_plus && user?.is_18_plus === false ? (
                    <div className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Restricted: Under 18 account</span>
                    </div>
                  ) : cartQuantity > 0 ? (
                    <div className="flex items-center gap-3 bg-[#078B35] text-white px-4 py-2.5 rounded-2xl shadow-md font-bold text-sm">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(cartQuantity - 1)}
                        className="hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-extrabold px-1">{cartQuantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(cartQuantity + 1)}
                        className="hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-8 py-3 rounded-2xl bg-[#078B35] hover:bg-[#075C2A] text-white text-sm font-extrabold shadow-md hover:scale-102 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to cart</span>
                    </button>
                  )}
                </div>

                {/* Store Delivering This Selection */}
                {activeOffer && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Store className="w-3.5 h-3.5 text-[#078B35] shrink-0" />
                      <span className="truncate">Fulfilling Store: <strong className="text-[#171717]">{activeOffer.shop_name}</strong></span>
                    </div>
                    <span className="font-semibold text-[#078B35] shrink-0">
                      {activeOffer.fulfillment_time_slot || "⚡ 10-15m"}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Servolocal Multi-Store Offer Comparison Matrix ─────────── */}
              {sortedOffers.length > 1 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-[#078B35]" />
                        <span>Available at {sortedOffers.length} Local Stores</span>
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Choose who fulfills your order: compare price, delivery speed and distance.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setOfferFilter("CHEAPEST")}
                        className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                          offerFilter === "CHEAPEST" ? "bg-[#078B35] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Lowest Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferFilter("FASTEST")}
                        className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                          offerFilter === "FASTEST" ? "bg-[#078B35] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Fastest 10m
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sortedOffers.map((offer, idx) => {
                      const isSelected = selectedOfferIndex === idx;
                      return (
                        <div
                          key={offer.inventory_id}
                          onClick={() => setSelectedOfferIndex(idx)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-[#EAF7EE]/50 border-[#078B35] ring-1 ring-[#078B35]/30 shadow-2xs"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#171717] truncate">{offer.shop_name}</span>
                              {offer.is_verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-[#078B35] shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 block truncate">
                              {offer.distance_km} km away • {offer.fulfillment_time_slot || "⚡ 10-15m"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <div className="text-right">
                              <span className="font-black text-sm text-[#171717] block">₹{offer.selling_price}</span>
                              {offer.mrp > offer.selling_price && (
                                <span className="text-[10px] text-gray-400 line-through">₹{offer.mrp}</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOfferIndex(idx);
                                handleAddToCart();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? "bg-[#078B35] text-white"
                                  : "bg-gray-100 hover:bg-[#078B35] hover:text-white text-gray-700"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select Store"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Why Shop From ServoLocal (Matching Image 3 Blinkit Section) ── */}
              <div className="pt-4 border-t border-gray-100 space-y-3.5">
                <span className="text-xs font-black text-[#171717] uppercase tracking-wider block">
                  Why shop from ServoLocal?
                </span>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-base">
                      ⚡
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-bold text-[#171717] block">Round The Clock Fast Delivery</strong>
                      <p className="text-gray-500 text-[11px] leading-snug">
                        Get authentic products delivered to your doorstep from verified local stores near you.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-base">
                      🏷️
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-bold text-[#171717] block">Best Local Prices &amp; Offers</strong>
                      <p className="text-gray-500 text-[11px] leading-snug">
                        Direct pricing straight from neighborhood dukaandaars with zero inflated platform commissions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-base">
                      🏪
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-bold text-[#171717] block">Wide Assortment</strong>
                      <p className="text-gray-500 text-[11px] leading-snug">
                        Browse 30,000+ daily essentials across food, grocery, dairy, electronics, and local favorites.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Similar Products Rail ────────────────────────────────────────── */}
        {similarProducts.length > 0 && (
          <section className="mt-12 space-y-4">
            <h3 className="text-lg font-extrabold text-[#171717]">
              Similar items in {product.category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarProducts.map((p) => {
                const itemCart = cart.find((c) => c.inventory_id === p.id);
                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isWishlisted={wishlist.includes(p.id)}
                    onToggleWishlist={toggleWishlist}
                    cartQuantity={itemCart ? itemCart.quantity : 0}
                    onAddToCart={() => {
                      setCart((prev) => {
                        const existing = prev.find((item) => item.inventory_id === p.id);
                        let updated: CartItem[];
                        if (existing) {
                          updated = prev.map((item) =>
                            item.inventory_id === p.id ? { ...item, quantity: item.quantity + 1 } : item
                          );
                        } else {
                          updated = [
                            ...prev,
                            {
                              inventory_id: p.id,
                              name: p.name,
                              image_url: p.image_url,
                              price: p.selling_price,
                              mrp: p.mrp,
                              quantity: 1,
                              shop_id: p.shop_id || 1,
                              shop_name: p.shop_name || "Verified Local Store",
                            },
                          ];
                        }
                        if (typeof window !== "undefined") {
                          localStorage.setItem("servo_cart", JSON.stringify(updated));
                        }
                        return updated;
                      });
                    }}
                    onUpdateCartQuantity={(id, qty) => {
                      setCart((prev) => {
                        let updated: CartItem[];
                        if (qty <= 0) {
                          updated = prev.filter((item) => item.inventory_id !== id);
                        } else {
                          updated = prev.map((item) =>
                            item.inventory_id === id ? { ...item, quantity: qty } : item
                          );
                        }
                        if (typeof window !== "undefined") {
                          localStorage.setItem("servo_cart", JSON.stringify(updated));
                        }
                        return updated;
                      });
                    }}
                    onClickProduct={(it) => {
                      router.push(`/product/${encodeURIComponent(it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/${it.id}`);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Cart Drawer ─────────────────────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={(id: number, qty: number) => {
          setCart((prev) => {
            let updated: CartItem[];
            if (qty <= 0) {
              updated = prev.filter((item) => item.inventory_id !== id);
            } else {
              updated = prev.map((item) =>
                item.inventory_id === id ? { ...item, quantity: qty } : item
              );
            }
            if (typeof window !== "undefined") {
              localStorage.setItem("servo_cart", JSON.stringify(updated));
            }
            return updated;
          });
        }}
        onClearCart={() => {
          setCart([]);
          localStorage.removeItem("servo_cart");
        }}
        currentLocality={currentLocality}
        user={user}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOrderPlaced={() => setIsCartOpen(false)}
      />

      {/* ── Location Selector Modal ─────────────────────────────────────── */}
      <LocationSelectorModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        currentLocality={currentLocality}
        onSelectLocation={(loc) => {
          setCurrentLocality(loc);
          localStorage.setItem("servo_locality", loc);
          setIsLocationOpen(false);
        }}
      />

      {/* ── Sign In Modal ───────────────────────────────────────────────── */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          setIsSignInOpen(false);
        }}
      />

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer onNavigateTab={(tab) => router.push(`/#${tab}`)} onOpenSupport={() => router.push("/account?tab=support")} onOpenLocation={() => setIsLocationOpen(true)} />
    </div>
  );
}
