"use client";

import React from "react";
import { X, Star, Heart, Plus, Minus, Truck, ShieldCheck, MapPin, Store, Check, Info } from "lucide-react";
import { ProductItem } from "@/types";

interface ProductDetailsModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  cartQuantity: number;
  onAddToCart: (product: ProductItem) => void;
  onUpdateCartQuantity: (productId: number, qty: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
  isWishlisted,
  onToggleWishlist,
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  const discountPercent = product.mrp > product.selling_price
    ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
    : 0;

  // Determine delivery model badge
  const isPanIndia = product.category === "Fashion" || product.category === "Electronics" || product.category === "Art & Craft";
  const isFood = product.category === "Food & Drinks" || product.category === "Street Food";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Image & Gallery */}
        <div className="w-full md:w-1/2 bg-[#F9FAFB] p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100">
          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white shadow-xs text-gray-700 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? "text-rose-500 fill-rose-500" : ""}`}
            />
          </button>

          <div className="w-full h-56 md:h-72 flex items-center justify-center">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
            />
          </div>

          {/* Delivery Model Badge */}
          <div className="mt-4 flex items-center gap-2">
            {isPanIndia ? (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1.5 border border-blue-200">
                <Truck className="w-3.5 h-3.5" />
                <span>Pan-India Courier (2-4 Days)</span>
              </span>
            ) : isFood ? (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
                <Store className="w-3.5 h-3.5" />
                <span>Freshly Prepared (30-45 Mins)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-[#EAF7EE] text-[#078B35] text-xs font-bold flex items-center gap-1.5 border border-[#078B35]/20">
                <span className="text-sm">⚡</span>
                <span>Hyperlocal Quick Delivery (10-15 Mins)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Details, Specs, Price & Actions */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            {/* Category & Shop info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                {product.category}
              </span>
              <span className="flex items-center gap-1 text-[#078B35] font-semibold">
                <Store className="w-3.5 h-3.5" />
                {product.shop_name || "Verified Local Store"}
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h2>

            {/* Rating & In-Stock */}
            <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-md bg-[#FFF4CE] text-[#171717] text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                <span>{product.rating || 4.6}</span>
              </div>
              <span className="text-xs text-gray-500">• 124 verified reviews</span>
              <span className="text-xs font-semibold text-[#078B35] flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> In Stock
              </span>
            </div>

            {/* Pricing Section */}
            <div className="pt-2 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-gray-900">
                ₹{product.selling_price.toLocaleString("en-IN")}
              </span>
              {product.mrp > product.selling_price && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.mrp.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-[#078B35] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Unit / Pack Size & Specifications */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Product Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-500 block">Pack Size</span>
                  <span className="font-semibold text-gray-800">1 Standard Unit</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-500 block">Brand / Origin</span>
                  <span className="font-semibold text-gray-800">{product.brand || "Local Verified"}</span>
                </div>
              </div>
            </div>

            {/* Quality Guarantee */}
            <div className="p-3 rounded-xl bg-[#F4FDF6] border border-[#078B35]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#078B35] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#075C2A] leading-relaxed">
                <strong className="block font-bold">100% Quality &amp; Authenticity Guaranteed</strong>
                Sourced fresh directly from local neighborhood sellers with easy replacement support.
              </div>
            </div>
          </div>

          {/* Sticky Bottom Add To Cart Controller */}
          <div className="pt-4 border-t border-gray-100">
            {cartQuantity > 0 ? (
              <div className="flex items-center justify-between bg-[#078B35] text-white rounded-2xl py-2 px-4 shadow-md">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
                    className="p-1.5 hover:bg-[#075C2A] rounded-xl active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-sm font-bold">{cartQuantity} Unit(s) in Cart</span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="p-1.5 hover:bg-[#075C2A] rounded-xl active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm font-bold">
                  ₹{(product.selling_price * cartQuantity).toLocaleString("en-IN")}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                className="w-full py-3.5 bg-[#078B35] hover:bg-[#075C2A] text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add to Cart • ₹{product.selling_price.toLocaleString("en-IN")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
