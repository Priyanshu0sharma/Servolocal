"use client";

import React from "react";
import { Home, LayoutGrid, Store, ShoppingBag, User } from "lucide-react";
import { SidebarTab } from "./Sidebar";
import { UserProfile } from "@/types";

interface MobileBottomNavProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenSignIn: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  cartCount,
  onOpenCart,
  user,
  onOpenSignIn,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFECE6] px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onTabChange("home")}
          aria-label="Home"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "home"
              ? "text-[#078B35] font-extrabold"
              : "text-[#666666] font-medium hover:text-[#171717]"
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === "home" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={() => onTabChange("categories")}
          aria-label="Categories"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "categories"
              ? "text-[#078B35] font-extrabold"
              : "text-[#666666] font-medium hover:text-[#171717]"
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${activeTab === "categories" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-0.5">Categories</span>
        </button>

        {/* 3. Nearby Stores */}
        <button
          type="button"
          onClick={() => onTabChange("stores")}
          aria-label="Nearby Stores"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "stores"
              ? "text-[#078B35] font-extrabold"
              : "text-[#666666] font-medium hover:text-[#171717]"
          }`}
        >
          <Store className={`w-5 h-5 ${activeTab === "stores" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-0.5">Stores</span>
        </button>

        {/* 4. Cart with live badge */}
        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Shopping Cart with ${cartCount} items`}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[#666666] font-medium hover:text-[#171717] transition-all cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-2" />
            {cartCount > 0 && (
              <span
                aria-live="polite"
                className="absolute -top-1.5 -right-2 bg-[#078B35] text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs"
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Cart</span>
        </button>

        {/* 5. Account / Orders */}
        <button
          type="button"
          onClick={() => {
            if (!user) {
              onOpenSignIn();
            } else if (typeof window !== "undefined") {
              window.location.href = "/account?tab=orders";
            }
          }}
          aria-label={user ? "My Orders & Account" : "Sign In"}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "orders" || activeTab === "profile"
              ? "text-[#078B35] font-extrabold"
              : "text-[#666666] font-medium hover:text-[#171717]"
          }`}
        >
          <User className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-0.5 truncate max-w-[45px]">
            {user ? "Account" : "Sign In"}
          </span>
        </button>
      </div>
    </nav>
  );
}
