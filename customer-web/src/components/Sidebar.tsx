"use client";

import React from "react";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Utensils,
  Headphones,
  Shirt,
  CookingPot,
  Sparkles,
  HeartPulse,
  Wrench,
  ArrowRight,
  Store,
} from "lucide-react";

export type SidebarTab =
  | "home"
  | "grocery"
  | "food"
  | "marketplace"
  | "stores"
  | "orders"
  | "wallet"
  | "offers"
  | "support"
  | "categories";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  selectedCategory?: string | null;
  onSelectCategory?: (category: string) => void;
  onExploreStores?: () => void;
  ordersCount?: number;
  walletBalance?: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  selectedCategory,
  onSelectCategory,
  onExploreStores,
}: SidebarProps) {
  const categoryItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    categoryName?: string;
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "categories", label: "All Categories", icon: LayoutGrid },
    { id: "grocery", label: "Grocery", icon: ShoppingBag, categoryName: "Grocery" },
    { id: "food", label: "Food & Drinks", icon: Utensils, categoryName: "Food & Drinks" },
    { id: "marketplace", label: "Electronics", icon: Headphones, categoryName: "Electronics" },
    { id: "marketplace", label: "Fashion", icon: Shirt, categoryName: "Fashion" },
    { id: "marketplace", label: "Home & Kitchen", icon: CookingPot, categoryName: "Home & Kitchen" },
    { id: "marketplace", label: "Beauty & Care", icon: Sparkles, categoryName: "Beauty & Care" },
    { id: "grocery", label: "Pharmacy", icon: HeartPulse, categoryName: "Pharmacy" },
    { id: "marketplace", label: "Local Services", icon: Wrench, categoryName: "Services" },
  ];

  return (
    <aside className="w-[220px] lg:w-[240px] shrink-0 bg-[#FAF7F2] border-r border-[#EFECE6] py-5 px-3 space-y-4 sticky top-[78px] h-[calc(100vh-78px)] select-none hidden md:flex flex-col justify-between overflow-y-auto">
      {/* Category Nav Links matching Mockup */}
      <div className="space-y-1">
        {categoryItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive =
            item.id === "home"
              ? activeTab === "home" && !selectedCategory
              : item.categoryName
              ? selectedCategory?.toLowerCase() === item.categoryName.toLowerCase()
              : activeTab === item.id;

          return (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => {
                if (item.id === "home") {
                  onTabChange("home");
                } else if (item.categoryName && onSelectCategory) {
                  onSelectCategory(item.categoryName);
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`w-full h-[42px] flex items-center gap-3 px-3.5 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer text-left ${
                isActive
                  ? "bg-[#EAF7EE] text-[#078B35] font-extrabold shadow-2xs"
                  : "bg-transparent text-[#4A3B32] font-semibold hover:bg-white hover:text-[#078B35]"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#078B35]" : "text-[#7C6E61]"
                }`}
              />
              <span className="leading-none truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Promo Card matching Mockup */}
      <div
        onClick={onExploreStores || (() => onTabChange("stores"))}
        className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 hover:border-amber-300 transition-all cursor-pointer group shadow-2xs space-y-1.5"
      >
        <div className="flex items-center gap-2 text-[#78350F]">
          <div className="w-6 h-6 rounded-lg bg-amber-200/60 flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold leading-tight">Explore Local Shops</span>
        </div>
        <p className="text-[11px] text-[#92400E] leading-relaxed">
          Find verified stores in your area with fast delivery &amp; best prices.
        </p>
        <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#78350F] group-hover:translate-x-0.5 transition-transform">
          <span>In Your Area</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </aside>
  );
}
