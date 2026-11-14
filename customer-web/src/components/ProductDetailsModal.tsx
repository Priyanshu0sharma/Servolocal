"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Heart,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  MapPin,
  Store,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Zap,
  Globe,
  Calendar,
} from "lucide-react";
import { ProductItem, CartItem } from "@/types";
import { getProductDetails, getProductOffers } from "@/lib/api";

export interface SellerOfferItem {
  inventory_id: number;
  shop_id: number;
  shop_name: string;
  shop_category: string;
  shop_rating: number;
  is_verified: boolean;
  locality_name: string;
  distance_km: number;
  selling_price: number;
  mrp: number;
  discount_percent: number;
  available_stock: number;
  in_stock: boolean;
  delivery_mode: string;
  fulfillment_time_slot: string;
  free_delivery_enabled?: boolean;
}

export interface GalleryPhoto {
  id?: number;
  url: string;
  type: string;
  caption?: string;
}

interface ProductDetailsModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentLocality?: string;
  cart: CartItem[];
  onAddToCart: (
    product: ProductItem,
    sellerOffer?: {
      shop_id: number;
      shop_name: string;
      selling_price: number;
      inventory_id?: number;
    }
  ) => void;
  onUpdateCartQuantity: (inventoryId: number, qty: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  currentLocality = "",
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  isWishlisted,
  onToggleWishlist,
}: ProductDetailsModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [offers, setOffers] = useState<SellerOfferItem[]>([]);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [productDetails, setProductDetails] = useState<any>(null);

  // Sync state when product opens
  useEffect(() => {
    if (!product || !isOpen) return;

    const currentId = product.id;
    const currentName = product.name;
    const currentImg = product.image_url;
    const currentShopId = product.shop_id || 1;
    const currentShopName = product.shop_name || "Verified Local Store";
    const currentPrice = product.selling_price;
    const currentMrp = product.mrp;
    const currentStock = product.available_stock || 50;
    const currentInStock = product.in_stock;
    const currentCategory = product.category;
    const currentRating = product.rating || 4.7;

    setActiveImageIndex(0);
    setSelectedOfferIndex(0);
    setSelectedUnitIdx(0);

    // Initial fallback gallery
    setGallery([
      { url: currentImg, type: "FRONT", caption: currentName },
    ]);

    let isMounted = true;
    async function loadData() {
      setIsLoadingOffers(true);
      try {
        // Fetch full master product details and gallery
        const details = await getProductDetails(currentId).catch(() => null);
        if (isMounted && details) {
          setProductDetails(details);
          if (details.gallery_images && details.gallery_images.length > 0) {
            setGallery(details.gallery_images);
          }
        }

        // Fetch multi-store comparison offers
        const offersRes = await getProductOffers(currentId).catch(() => null);
        if (isMounted && offersRes && offersRes.offers) {
          setOffers(offersRes.offers);
        } else if (isMounted) {
          // Fallback single offer if no multi-offers exist
          setOffers([
            {
              inventory_id: currentId,
              shop_id: currentShopId,
              shop_name: currentShopName,
              shop_category: currentCategory,
              shop_rating: currentRating,
              is_verified: true,
              locality_name: currentLocality,
              distance_km: 1.2,
              selling_price: currentPrice,
              mrp: currentMrp,
              discount_percent:
                currentMrp > currentPrice
                  ? Math.round(
                      ((currentMrp - currentPrice) / currentMrp) *
                        100
                    )
                  : 0,
              available_stock: currentStock,
              in_stock: currentInStock,
              delivery_mode: "IN_MINUTES",
              fulfillment_time_slot: "⚡ 10-15 Mins",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        if (isMounted) setIsLoadingOffers(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [product, isOpen, currentLocality]);

  const currentDisplayImage =
    gallery[activeImageIndex]?.url || product?.image_url;
  const activeOffer = offers[selectedOfferIndex] || {
    inventory_id: product?.id || 1,
    shop_id: product?.shop_id || 1,
    shop_name: product?.shop_name || "Local Verified Store",
    selling_price: product?.selling_price || 0,
    mrp: product?.mrp || 0,
    discount_percent:
      product && product.mrp > product.selling_price
        ? Math.round(
            ((product.mrp - product.selling_price) / product.mrp) * 100
          )
        : 0,
    delivery_mode: "IN_MINUTES",
    fulfillment_time_slot: "⚡ 10-15 Mins",
  };

  const unitOptions = React.useMemo(() => {
    const baseUnit = product?.unit || productDetails?.unit || "750 ml";
    const basePrice = activeOffer.selling_price;
    const baseMrp = activeOffer.mrp || Math.round(basePrice * 1.08);
    const baseDiscount =
      baseMrp > basePrice
        ? Math.round(((baseMrp - basePrice) / baseMrp) * 100)
        : 0;

    const list = [
      {
        id: "single",
        label: baseUnit,
        price: basePrice,
        mrp: baseMrp,
        discount: baseDiscount,
        multiplier: 1,
      },
    ];

    if (productDetails?.variants && productDetails.variants.length > 0) {
      productDetails.variants.forEach((v: any) => {
        list.push({
          id: `var_${v.id}`,
          label: v.unit,
          price: v.selling_price,
          mrp: v.mrp,
          discount: v.discount_percent || 0,
          multiplier: 1,
        });
      });
    } else {
      // Add multipack value option like Blinkit's 2 x 750 ml
      const multiPrice = Math.round(basePrice * 1.95);
      const multiMrp = Math.round(baseMrp * 2);
      const multiDiscount = Math.round(
        ((multiMrp - multiPrice) / multiMrp) * 100
      );
      list.push({
        id: "multi_2",
        label: `2 x ${baseUnit}`,
        price: multiPrice,
        mrp: multiMrp,
        discount: multiDiscount,
        multiplier: 2,
      });
    }
    return list;
  }, [product, productDetails, activeOffer.selling_price, activeOffer.mrp]);

  const activeUnit = unitOptions[selectedUnitIdx] || unitOptions[0];
  const activeUnitPrice = activeUnit?.price || activeOffer.selling_price;
  const activeUnitMrp = activeUnit?.mrp || activeOffer.mrp;
  const activeUnitDiscount = activeUnit?.discount || activeOffer.discount_percent;

  const cartItemForActiveOffer = cart.find(
    (c) => c.inventory_id === activeOffer.inventory_id
  );
  const cartQtyForActive = cartItemForActiveOffer
    ? cartItemForActiveOffer.quantity
    : 0;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#EFECE6] flex flex-col md:flex-row max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-black flex items-center justify-center transition-colors shadow-xs cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* ── LEFT: Product Image & Thumbnail Gallery (Blinkit Style) ──────── */}
        <div className="w-full md:w-[48%] bg-[#FAF7F2] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#EFECE6] relative overflow-y-auto">
          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-label="Wishlist"
            className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-700 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-600"
              }`}
            />
          </button>

          {/* Large Main Image Display with Prev/Next buttons */}
          <div className="relative w-full h-56 sm:h-72 lg:h-80 flex items-center justify-center bg-white rounded-2xl border border-gray-100 p-4 overflow-hidden group">
            <img
              src={currentDisplayImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#078B35] transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#078B35] transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Gallery Row (Switching images on click) */}
          {gallery.length > 1 && (
            <div className="pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden p-1 bg-white border cursor-pointer transition-all shrink-0 flex items-center justify-center ${
                    activeImageIndex === idx
                      ? "border-[#078B35] ring-2 ring-[#078B35]/20 shadow-xs scale-105"
                      : "border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.caption || `View ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Product Specifications / Details Accordion */}
          <div className="pt-4 border-t border-[#EFECE6] space-y-2 text-xs">
            <h4 className="font-extrabold text-[#2D2319] uppercase tracking-wider text-[11px]">
              Product Specifications
            </h4>
            <div className="space-y-1.5 text-[#6B5E52] leading-relaxed">
              <p>
                <strong className="text-[#2D2319]">Brand:</strong>{" "}
                {productDetails?.brand || product.brand || "Authentic Verified"}
              </p>
              <p>
                <strong className="text-[#2D2319]">Category:</strong>{" "}
                {product.category} &gt; {product.sub_category || "General"}
              </p>
              <p>
                <strong className="text-[#2D2319]">Unit:</strong>{" "}
                {product.unit || productDetails?.unit || "1 Standard Pack"}
              </p>
              {productDetails?.description && (
                <p className="line-clamp-2 pt-0.5 text-[11.5px]">
                  {productDetails.description}
                </p>
              )}
            </div>

            {/* FSSAI & Quality Guarantee */}
            <div className="p-2.5 rounded-xl bg-[#EAF7EE] border border-[#078B35]/20 flex items-start gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-[#078B35] shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-[#075C2A] font-medium leading-snug">
                <strong>100% Genuine Guarantee:</strong> Sourced directly from
                authorized FMCG distributors &amp; verified neighborhood shops.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Details, Unit Selector, and Multi-Store Offers ────────── */}
        <div className="w-full md:w-[52%] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="text-[11px] text-[#8C7663] font-medium flex items-center gap-1.5 truncate">
              <span>Home</span>
              <span>/</span>
              <span className="truncate">{product.category}</span>
              <span>/</span>
              <span className="text-[#2D2319] font-bold truncate">
                {product.name}
              </span>
            </div>

            {/* Product Title + Veg Symbol */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#2D2319] leading-snug">
                  {product.name}
                </h1>

                {/* Green Veg Icon */}
                <div
                  className="w-4 h-4 rounded-sm border border-emerald-600 flex items-center justify-center shrink-0 mt-1"
                  title="100% Vegetarian"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <div className="px-1.5 py-0.5 rounded bg-[#FFF4CE] text-[#2D2319] font-bold text-[11px] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                  <span>{product.rating || 4.7}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-[#8C7663] text-[11.5px]">
                  500+ orders delivered
                </span>
              </div>
            </div>

            {/* Select Unit / Variants Pills (Blinkit Style) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#8C7663] uppercase tracking-wider block">
                Select Unit
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {unitOptions.map((u, idx) => {
                  const isSelected = selectedUnitIdx === idx;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUnitIdx(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-2 border-[#078B35] bg-[#EAF7EE] text-[#075C2A] shadow-2xs"
                          : "border border-gray-200 bg-white hover:border-[#078B35] text-gray-700"
                      }`}
                    >
                      <span>{u.label}</span>
                      {u.discount > 0 && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-extrabold ${
                            isSelected
                              ? "bg-[#078B35] text-white"
                              : "bg-emerald-50 text-[#078B35]"
                          }`}
                        >
                          {u.discount}% OFF
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-extrabold ${
                          isSelected ? "text-[#075C2A]" : "text-gray-500"
                        }`}
                      >
                        ₹{u.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Selected Unit Price & MRP (Blinkit Buy Box) */}
            <div className="flex items-baseline gap-2 pt-1 pb-1">
              <span className="text-2xl font-black text-[#2D2319]">
                ₹{activeUnitPrice}
              </span>
              {activeUnitMrp > activeUnitPrice && (
                <span className="text-xs text-gray-400 line-through">
                  MRP ₹{activeUnitMrp}
                </span>
              )}
              {activeUnitDiscount > 0 && (
                <span className="text-[11px] font-extrabold text-[#078B35] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                  {activeUnitDiscount}% OFF
                </span>
              )}
              <span className="text-[10.5px] text-gray-400 block ml-auto">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* ── THE SERVOLOCAL DIFFERENCE: MULTI-VENDOR STORES LIST ─────────── */}
            <div className="pt-2 border-t border-[#EFECE6] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#2D2319]">
                  <Store className="w-4 h-4 text-[#078B35]" />
                  <span>Available from these stores in {currentLocality}</span>
                </div>
                <span className="text-[11px] font-bold text-[#078B35] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                  {offers.length} Sellers
                </span>
              </div>

              {isLoadingOffers ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  Fetching live shop stock &amp; delivery times...
                </div>
              ) : (
                <div className="space-y-2">
                  {offers.map((offer, idx) => {
                    const isSelected = selectedOfferIndex === idx;
                    const offerCartItem = cart.find(
                      (c) => c.inventory_id === offer.inventory_id
                    );
                    const offerQty = offerCartItem ? offerCartItem.quantity : 0;

                    const isQuick = offer.delivery_mode === "IN_MINUTES";
                    const isOneDay = offer.delivery_mode === "ONE_DAY";
                    const isPanIndia = offer.delivery_mode === "PAN_INDIA";

                    return (
                      <div
                        key={offer.inventory_id}
                        onClick={() => setSelectedOfferIndex(idx)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#078B35] bg-[#FAFDFB] ring-1 ring-[#078B35]/20 shadow-xs"
                            : "border-[#EFECE6] bg-white hover:border-gray-300"
                        }`}
                      >
                        {/* Shop Info & Delivery Mode */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-[13px] font-extrabold text-[#2D2319] truncate">
                              {offer.shop_name}
                            </h4>
                            {offer.is_verified && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-[#078B35] text-[9.5px] font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                Verified
                              </span>
                            )}
                          </div>

                          {/* Delivery Mode Pill */}
                          <div className="flex items-center gap-2 text-[11px] text-[#6B5E52]">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                                isQuick
                                  ? "bg-emerald-100 text-[#075C2A]"
                                  : isOneDay
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {isQuick && <Zap className="w-2.5 h-2.5" />}
                              {isOneDay && <Calendar className="w-2.5 h-2.5" />}
                              {isPanIndia && <Globe className="w-2.5 h-2.5" />}
                              <span>
                                {isQuick
                                  ? "In Minutes"
                                  : isOneDay
                                  ? "In 1 Day"
                                  : "Pan India"}
                              </span>
                            </span>
                            <span>•</span>
                            <span>{offer.fulfillment_time_slot}</span>
                            <span>•</span>
                            <span>{offer.locality_name?.split(",")[0]}</span>
                          </div>
                        </div>

                        {/* Price & Add to Cart button for this specific shop */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-[#2D2319] block">
                              ₹{offer.selling_price}
                            </span>
                            {offer.mrp > offer.selling_price && (
                              <span className="text-[10px] text-gray-400 line-through block">
                                ₹{offer.mrp}
                              </span>
                            )}
                          </div>

                          {offerQty > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 bg-[#078B35] text-white rounded-xl py-1 px-2 text-xs font-bold shadow-2xs"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateCartQuantity(
                                    offer.inventory_id,
                                    offerQty - 1
                                  )
                                }
                                className="p-0.5 hover:bg-[#075C2A] rounded active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs">
                                {offerQty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onAddToCart(product, {
                                    shop_id: offer.shop_id,
                                    shop_name: offer.shop_name,
                                    selling_price: offer.selling_price,
                                    inventory_id: offer.inventory_id,
                                  })
                                }
                                className="p-0.5 hover:bg-[#075C2A] rounded active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(product, {
                                  shop_id: offer.shop_id,
                                  shop_name: offer.shop_name,
                                  selling_price: offer.selling_price,
                                  inventory_id: offer.inventory_id,
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Why Shop on ServoLocal Trust Strip */}
            <div className="pt-3 border-t border-[#EFECE6] grid grid-cols-3 gap-2 text-center text-[10.5px] text-[#6B5E52]">
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-base block mb-0.5">⚡</span>
                <strong className="block text-[#2D2319]">Superfast</strong>
                <span>10-15 min delivery</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-base block mb-0.5">🏷</span>
                <strong className="block text-[#2D2319]">Local Prices</strong>
                <span>Direct shop rates</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-base block mb-0.5">🛡</span>
                <strong className="block text-[#2D2319]">Verified</strong>
                <span>100% Genuine</span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Cart Status */}
          <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between gap-3 bg-white">
            <div>
              <span className="text-[11px] text-[#8C7663] block">
                Selected Shop:{" "}
                <strong className="text-[#2D2319]">
                  {activeOffer.shop_name}
                </strong>
              </span>
              <span className="text-base font-extrabold text-[#2D2319]">
                ₹{activeUnitPrice}
              </span>
            </div>

            {cartQtyForActive > 0 ? (
              <div className="flex items-center gap-3 bg-[#078B35] text-white rounded-2xl py-2 px-4 shadow-md font-bold text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCartQuantity(
                      activeOffer.inventory_id,
                      cartQtyForActive - 1
                    )
                  }
                  className="p-1 hover:bg-[#075C2A] rounded-md active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono">{cartQtyForActive} in Cart</span>
                <button
                  type="button"
                  onClick={() =>
                    onAddToCart(product, {
                      shop_id: activeOffer.shop_id,
                      shop_name: activeOffer.shop_name,
                      selling_price: activeUnitPrice,
                      inventory_id: activeOffer.inventory_id,
                    })
                  }
                  className="p-1 hover:bg-[#075C2A] rounded-md active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onAddToCart(product, {
                    shop_id: activeOffer.shop_id,
                    shop_name: activeOffer.shop_name,
                    selling_price: activeUnitPrice,
                    inventory_id: activeOffer.inventory_id,
                  })
                }
                className="py-2.5 px-6 rounded-2xl bg-[#078B35] hover:bg-[#075C2A] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>
                  Add to Cart • ₹{activeUnitPrice}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
