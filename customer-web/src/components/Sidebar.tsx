"use client";

import React from "react";
import {
  Home,
  Zap,
  Utensils,
  Package,
  Store,
  ShoppingBag,
  Coins,
  Tag,
  HelpCircle,
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
  ordersCount?: number;
  walletBalance?: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  ordersCount = 0,
  walletBalance = 150,
}: SidebarProps) {
  const mainNavItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    subLabel?: string;
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "grocery", label: "Grocery & Dairy", icon: Zap, subLabel: "⚡ 10-15 Min" },
    { id: "food", label: "Food & Cafes", icon: Utensils, subLabel: "🍽️ 30-45 Min" },
    { id: "marketplace", label: "Marketplace", icon: Package, subLabel: "📦 Pan-India" },
    { id: "stores", label: "Nearby Stores", icon: Store },
  ];

  const secondaryNavItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    {
      id: "orders",
      label: "My Orders",
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : undefined,
    },
    {
      id: "wallet",
      label: "Servo Wallet",
      icon: Coins,
      badge: `₹${walletBalance}`,
    },
    { id: "offers", label: "Offers & Deals", icon: Tag },
    { id: "support", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <aside className="w-[240px] shrink-0 bg-[#FFFFFF] border-r border-[#E8ECE9] py-5 px-3 space-y-4 sticky top-[84px] h-[calc(100vh-84px)] select-none hidden md:block overflow-y-auto">
      {/* Category / Shopping Modules */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
          Explore Delivery
        </span>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full h-[46px] flex items-center justify-between px-3 rounded-xl text-sm transition-all cursor-pointer text-left ${
                isActive
                  ? "bg-[#EAF7EE] text-[#078B35] font-bold shadow-2xs"
                  : "bg-white text-[#4B5563] font-medium hover:bg-[#F9FAFB] hover:text-[#171717]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#078B35]" : "text-[#4B5563]"
                  }`}
                />
                <span className="leading-none text-[13px] truncate">{item.label}</span>
              </div>

              {item.subLabel && (
                <span className="text-[9px] font-semibold text-gray-400 shrink-0">
                  {item.subLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Account & Activity Modules */}
      <div className="space-y-1 pt-3 border-t border-[#E8ECE9]">
        <span className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
          Account &amp; Rewards
        </span>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full h-[44px] flex items-center justify-between px-3 rounded-xl text-sm transition-all cursor-pointer text-left ${
                isActive
                  ? "bg-[#EAF7EE] text-[#078B35] font-bold shadow-2xs"
                  : "bg-white text-[#4B5563] font-medium hover:bg-[#F9FAFB] hover:text-[#171717]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#078B35]" : "text-[#4B5563]"
                  }`}
                />
                <span className="leading-none text-[13px] truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[#078B35] text-white"
                      : "bg-[#EAF7EE] text-[#078B35]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
