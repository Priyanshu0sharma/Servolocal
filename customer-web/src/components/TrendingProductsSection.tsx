"use client";

import React from "react";
import { ArrowRight, Flame } from "lucide-react";
import ProductCard from "./ProductCard";
import { ProductItem } from "@/types";

interface TrendingProductsSectionProps {
  products: ProductItem[];
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  cart: Array<{ inventory_id: number; quantity: number }>;
  onAddToCart: (product: ProductItem) => void;
  onUpdateCartQuantity: (productId: number, qty: number) => void;
  onClickProduct: (product: ProductItem) => void;
  onViewAll?: () => void;
}

export default function TrendingProductsSection({
  products,
  wishlist,
  onToggleWishlist,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onClickProduct,
  onViewAll,
}: TrendingProductsSectionProps) {
  return (
    <section className="space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <h3 className="text-base sm:text-lg font-extrabold text-[#2D2319]">
            Trending Near You
          </h3>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of 6 Products Matching Mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {products.slice(0, 6).map((product) => {
          const cartItem = cart.find((i) => i.inventory_id === product.id);
          return (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              cartQuantity={cartItem ? cartItem.quantity : 0}
              onAddToCart={onAddToCart}
              onUpdateCartQuantity={onUpdateCartQuantity}
              onClickProduct={onClickProduct}
            />
          );
        })}
      </div>
    </section>
  );
}

