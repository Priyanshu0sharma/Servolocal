"use client";

import React from "react";
import { Star, Heart, Plus, Minus } from "lucide-react";
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

  return (
    <div
      onClick={() => {
        if (onClickProduct) onClickProduct(product);
      }}
      className="bg-white rounded-2xl border border-[#EFECE6] p-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative select-none cursor-pointer"
    >
      {/* Top Image Container & Floating Wishlist Heart */}
      <div className="relative w-full h-[130px] rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 border border-gray-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-2xs flex items-center justify-center text-[#2D2319] hover:text-rose-500 hover:scale-110 transition-all cursor-pointer"
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
      </div>

      {/* Price & Discount Row */}
      <div className="pt-2 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[15px] font-extrabold text-[#2D2319]">
          ₹{displayPrice.toLocaleString("en-IN")}
        </span>
        {product.mrp && product.mrp > displayPrice ? (
          <>
            <span className="text-[11px] text-gray-400 line-through">
              ₹{product.mrp}
            </span>
            <span className="text-[10px] font-bold text-[#078B35]">
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
        {cartQuantity > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-[#078B35] text-white rounded-xl py-1.5 px-3 text-xs font-bold shadow-2xs"
          >
            <button
              type="button"
              onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
              className="p-0.5 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-xs">{cartQuantity}</span>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="p-0.5 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-1.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
