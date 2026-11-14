"use client";

import React from "react";
import { Star, Heart, Plus, Minus, Store } from "lucide-react";
import { ProductItem } from "@/types";

interface ProductCardProps {
  product: ProductItem;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  cartQuantity: number;
  onAddToCart: (product: ProductItem) => void;
  onUpdateCartQuantity: (productId: number, qty: number) => void;
  onClickProduct?: (product: ProductItem) => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
  onClickProduct,
}: ProductCardProps) {
  const displayPrice = product.selling_price;
  const ratingValue = product.rating || 4.6;
  const isShopClosed = product.shop_is_open === false;

  return (
    <div
      role="article"
      aria-label={product.name}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClickProduct) {
          e.preventDefault();
          onClickProduct(product);
        }
      }}
      onClick={() => {
        if (onClickProduct) onClickProduct(product);
      }}
      className={`rounded-2xl border p-3 shadow-2xs transition-all flex flex-col justify-between group relative select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#078B35] focus-visible:outline-none ${
        isShopClosed
          ? "bg-gray-50/80 border-gray-200/90 opacity-75"
          : "bg-white border-[#EFECE6] hover:shadow-md"
      }`}
    >
      {/* Top Image Container & Floating Wishlist Heart */}
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center p-2 border transition-all ${
        isShopClosed ? "bg-gray-100/70 border-gray-200 grayscale-[35%]" : "bg-white border-gray-100"
      }`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-2xs flex items-center justify-center text-[#2D2319] hover:text-rose-500 hover:scale-110 active:scale-90 transition-all cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "text-rose-500 fill-rose-500" : "text-[#2D2319]"
            }`}
          />
        </button>

        <img
          src={product.image_url}
          alt={product.name}
          width={140}
          height={140}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Name & Unit */}
      <div className="pt-2">
        <h3 className="text-[13px] font-bold text-[#2D2319] leading-snug line-clamp-1 group-hover:text-[#078B35] transition-colors">
          {product.name}
        </h3>
        {product.unit && (
          <span className="text-[11px] text-[#8C7663] block mt-0.5 truncate">
            {product.unit}
          </span>
        )}

        {/* Local Shop Info (Zomato-style Store Tag: Green when Open, Transparent Grey when Closed) */}
        <div className="pt-1.5 flex items-center justify-between text-[11px] gap-1">
          <div
            className={`flex items-center gap-1 min-w-0 px-1.5 py-0.5 rounded-md border transition-colors ${
              isShopClosed
                ? "bg-gray-100/70 border-gray-200/60 text-gray-400"
                : "bg-emerald-50/70 border-emerald-100/80 text-emerald-800 font-semibold"
            }`}
          >
            <Store className={`w-3 h-3 shrink-0 ${isShopClosed ? "text-gray-400" : "text-[#078B35]"}`} />
            <span className="truncate">{product.shop_name || "Local Shop"}</span>
          </div>
          {isShopClosed ? (
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {product.shop_distance_km ? `${product.shop_distance_km} km` : ""}
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 shrink-0 font-medium">
              {product.local_eta_mins || "⚡ 10-15m"}
            </span>
          )}
        </div>
      </div>

      {/* Price & Discount Row */}
      <div className="pt-2 flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-[15px] font-extrabold ${isShopClosed ? "text-gray-400" : "text-[#2D2319]"}`}>
          ₹{displayPrice.toLocaleString("en-IN")}
        </span>
        {product.mrp && product.mrp > displayPrice ? (
          <>
            <span className="text-[11px] text-gray-400 line-through">
              ₹{product.mrp}
            </span>
            <span className={`text-[10px] font-bold ${isShopClosed ? "text-gray-400" : "text-[#078B35]"}`}>
              ({Math.round(((product.mrp - displayPrice) / product.mrp) * 100)}% OFF)
            </span>
          </>
        ) : (
          <div className="ml-auto px-1.5 py-0.5 rounded bg-[#FFF4CE] text-[#2D2319] text-[10px] font-semibold flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-[#F5A623] text-[#F5A623]" />
            <span>{ratingValue}</span>
          </div>
        )}
      </div>

      {/* Add To Cart Controller */}
      <div className="pt-2.5">
        {isShopClosed ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full py-1.5 rounded-xl bg-gray-100/80 border border-gray-200/60 text-gray-400 text-xs font-semibold text-center select-none cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Store className="w-3 h-3 text-gray-400" />
            <span>Unavailable</span>
          </div>
        ) : cartQuantity > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-[#078B35] text-white rounded-xl py-1.5 px-3 text-xs font-bold shadow-2xs"
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
              className="p-0.5 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-xs" aria-live="polite">{cartQuantity}</span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              onClick={() => onAddToCart(product)}
              className="p-0.5 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-1.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
