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
  // Standard Catalog Product Layout (Clean & Responsive Real UI)
  const displayPrice = product.selling_price;
  const ratingValue = product.rating || 4.6;

  return (
    <div
      onClick={() => {
        if (onClickProduct) onClickProduct(product);
      }}
      className="bg-[#FFFFFF] rounded-[18px] border border-[#E8ECE9] p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative select-none cursor-pointer"
    >
      {/* Top Image Container & Floating Wishlist Heart */}
      <div className="relative w-full h-[140px] rounded-[14px] bg-white overflow-hidden flex items-center justify-center p-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-2xs flex items-center justify-center text-[#171717] hover:text-rose-500 hover:scale-110 transition-all cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "text-rose-500 fill-rose-500" : "text-[#171717]"
            }`}
          />
        </button>

        <img
          src={product.image_url}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Name */}
      <div className="pt-2">
        <h3 className="text-[13.5px] font-semibold text-[#171717] leading-snug line-clamp-1 group-hover:text-[#078B35] transition-colors">
          {product.name}
        </h3>
      </div>

      {/* Price & Rating Badge Row */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[15px] font-bold text-[#171717]">
          ₹{displayPrice.toLocaleString("en-IN")}
        </span>

        {/* Rating Badge matching reference */}
        <div className="px-2 py-0.5 rounded-md bg-[#FFF4CE] text-[#171717] text-[11px] font-semibold flex items-center gap-1">
          <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
          <span>{ratingValue}</span>
        </div>
      </div>

      {/* Add To Cart Controller */}
      <div className="pt-2.5">
        {cartQuantity > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-[#078B35] text-white rounded-xl py-1 px-3 text-xs font-bold shadow-2xs"
          >
            <button
              type="button"
              onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
              className="p-1 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-xs">{cartQuantity} in Cart</span>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="p-1 hover:bg-[#075C2A] rounded-md active:scale-90 transition-transform"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-1.5 rounded-xl bg-[#EAF7EE] hover:bg-[#078B35] text-[#078B35] hover:text-white border border-[#078B35]/20 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
          >
            + ADD
          </button>
        )}
      </div>
    </div>
  );
}
