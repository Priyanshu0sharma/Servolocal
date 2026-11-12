"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export interface CategoryItem3D {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  countLabel?: string;
}

interface CategoriesSectionProps {
  onSelectCategory: (categoryName: string) => void;
  onViewAll?: () => void;
}

export const CATEGORIES_3D: CategoryItem3D[] = [
  { id: "grocery", name: "Grocery", emoji: "🥦", bgColor: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "food", name: "Food & Drinks", emoji: "🍔", bgColor: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "electronics", name: "Electronics", emoji: "🎧", bgColor: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { id: "fashion", name: "Fashion", emoji: "👕", bgColor: "bg-rose-50 text-rose-800 border-rose-200" },
  { id: "home", name: "Home & Kitchen", emoji: "🍲", bgColor: "bg-orange-50 text-orange-800 border-orange-200" },
  { id: "beauty", name: "Beauty & Care", emoji: "🧴", bgColor: "bg-pink-50 text-pink-800 border-pink-200" },
  { id: "pharmacy", name: "Pharmacy", emoji: "➕", bgColor: "bg-teal-50 text-teal-800 border-teal-200" },
  { id: "services", name: "Local Services", emoji: "🔧", bgColor: "bg-slate-50 text-slate-800 border-slate-200" },
  { id: "more", name: "More", emoji: "•••", bgColor: "bg-stone-50 text-stone-700 border-stone-200" },
];

export default function CategoriesSection({
  onSelectCategory,
  onViewAll,
}: CategoriesSectionProps) {
  return (
    <section className="space-y-3.5 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#2D2319]">
            Shop by Category
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#078B35] hover:text-[#075C2A] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4">
        {CATEGORIES_3D.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.name)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#EFECE6] hover:border-[#078B35] hover:shadow-md transition-all cursor-pointer group text-center"
          >
            {/* 3D Emoji Icon Bubble */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border transition-transform duration-200 group-hover:scale-110 shadow-2xs ${cat.bgColor}`}
            >
              <span>{cat.emoji}</span>
            </div>

            <span className="mt-2 text-[11.5px] font-bold text-[#2D2319] group-hover:text-[#078B35] leading-tight line-clamp-1 transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
