"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface PromoBannersSectionProps {
  onSelectCategory: (categoryName: string) => void;
}

export default function PromoBannersSection({
  onSelectCategory,
}: PromoBannersSectionProps) {
  const banners = [
    {
      id: "grocery-banner",
      category: "Grocery",
      title: "Daily Essentials",
      badge: "Up to 50% OFF",
      btnText: "Shop Now",
      btnBg: "bg-white text-[#0A4B1F] hover:bg-emerald-50",
      bgGradient: "from-[#0F4722] via-[#1B6334] to-[#0A3819]",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "food-banner",
      category: "Food & Drinks",
      title: "Food Fiesta",
      badge: "Flat 40% OFF",
      btnText: "Order Now",
      btnBg: "bg-white text-[#781B09] hover:bg-rose-50",
      bgGradient: "from-[#781B09] via-[#9B250E] to-[#591407]",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "electronics-banner",
      category: "Electronics",
      title: "Electronics Deals",
      badge: "Up to 30% OFF",
      btnText: "Explore Now",
      btnBg: "bg-white text-[#381B6D] hover:bg-purple-50",
      bgGradient: "from-[#381B6D] via-[#4D2692] to-[#2B1554]",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4 xl:gap-5 select-none">
      {banners.map((b) => (
        <div
          key={b.id}
          onClick={() => onSelectCategory(b.category)}
          className={`relative p-5 rounded-3xl bg-gradient-to-br ${b.bgGradient} text-white shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden flex items-center justify-between min-h-[140px]`}
        >
          {/* Left Text */}
          <div className="space-y-1.5 z-10">
            <h4 className="text-base sm:text-lg font-extrabold text-white leading-tight">
              {b.title}
            </h4>
            <div className="text-sm font-extrabold text-[#FFD52A] leading-tight">
              {b.badge}
            </div>
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs group-hover:scale-102 ${b.btnBg}`}
              >
                <span>{b.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Right Product Graphic */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0 transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300">
            <img
              src={b.image}
              alt={b.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ))}
    </section>
  );
}

