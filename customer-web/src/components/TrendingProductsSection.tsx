"use client";

import React from "react";
import { ArrowRight, Flame } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { ProductItem } from "@/types";

interface TrendingProductsSectionProps {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  products: ProductItem[];
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  cart: Array<{ inventory_id: number; quantity: number }>;
  onAddToCart: (product: ProductItem) => void;
  onUpdateCartQuantity: (productId: number, qty: number) => void;
  onClickProduct: (product: ProductItem) => void;
  onViewAll?: () => void;
  limit?: number;
  isLoading?: boolean;
}

export default function TrendingProductsSection({
  title = "Trending Near You",
  icon,
  subtitle,
  products,
  wishlist,
  onToggleWishlist,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onClickProduct,
  onViewAll,
  limit = 12,
  isLoading = false,
}: TrendingProductsSectionProps) {
  const displayItems = products.slice(0, limit);
  if (!isLoading && displayItems.length === 0) return null;

  return (
    <section className="space-y-3.5 select-none pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon || <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />}
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2D2319] leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11.5px] text-[#8C7663]">{subtitle}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>See all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of Products Matching Blinkit/ServoLocal Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))
          : displayItems.map((product) => {
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

