"use client";

import React, { useRef } from "react";
import { Store, Star, ArrowRight, ChevronLeft, ChevronRight, Clock, ShieldCheck } from "lucide-react";

export interface ShopItem {
  id: number;
  name: string;
  category: string;
  image_url?: string;
  is_open?: boolean;
  rating?: number;
  locality_name?: string;
  distance_km?: number;
  local_eta_mins?: string;
  free_delivery_enabled?: boolean;
  is_verified?: boolean;
}

interface PopularShopsSectionProps {
  currentLocality: string;
  shops: ShopItem[];
  onSelectShop: (shopName: string, shopId?: number) => void;
  onViewAll?: () => void;
}

export default function PopularShopsSection({
  currentLocality,
  shops,
  onSelectShop,
  onViewAll,
}: PopularShopsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getBadgeForIndex = (index: number) => {
    if (index === 0) return { text: "Fast Delivery", bg: "bg-[#078B35] text-white" };
    if (index === 1) return { text: "Local Shop", bg: "bg-amber-600 text-white" };
    if (index === 2) return { text: "Trusted", bg: "bg-emerald-700 text-white" };
    return { text: "Popular", bg: "bg-blue-600 text-white" };
  };

  return (
    <section className="space-y-3.5 select-none relative">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#2D2319]">
            Popular Local Shops Near {currentLocality || "Kukas"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Arrow Buttons */}
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#078B35] hover:text-[#078B35] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#078B35] hover:text-[#078B35] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer ml-2 group"
          >
            <span>View All Stores</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
      >
        {shops.map((shop, idx) => {
          const badge = getBadgeForIndex(idx);
          const ratingVal = shop.rating || 4.8;

          return (
            <div
              key={shop.id}
              onClick={() => onSelectShop(shop.name, shop.id)}
              className="w-[260px] sm:w-[280px] shrink-0 bg-white rounded-2xl border border-[#EFECE6] p-3 shadow-2xs hover:shadow-md hover:border-[#078B35]/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Shop Image Container */}
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={shop.image_url || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"}
                  alt={shop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Floating Category Badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${badge.bg}`}
                >
                  {badge.text}
                </span>

                {shop.is_verified && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[#078B35] text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Shop Info */}
              <div className="pt-2.5 space-y-1">
                <h4 className="text-sm font-extrabold text-[#2D2319] group-hover:text-[#078B35] transition-colors truncate">
                  {shop.name}
                </h4>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                  <span className="font-bold text-[#2D2319]">{ratingVal}</span>
                  <span className="text-[11px] text-[#8C7663]">• (850+ reviews)</span>
                </div>

                <p className="text-[11px] text-[#8C7663] truncate">
                  {shop.category}
                </p>

                {/* ETA Row */}
                <div className="pt-1.5 flex items-center justify-between text-xs font-semibold text-[#078B35]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{shop.local_eta_mins || "10-15 min"}</span>
                  </div>
                  <span className="text-[11px] text-[#8C7663] font-normal">
                    {shop.locality_name?.split(",")[0] || "Local Area"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

