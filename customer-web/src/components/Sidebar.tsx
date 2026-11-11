"use client";

import React from "react";
import { Home, LayoutGrid, Store, ShoppingBag, Tag } from "lucide-react";

export type SidebarTab = "home" | "categories" | "stores" | "orders" | "offers";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  ordersCount?: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  ordersCount = 0,
}: SidebarProps) {
  const navItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "categories", label: "Categories", icon: LayoutGrid },
    { id: "stores", label: "Nearby Stores", icon: Store },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: ordersCount > 0 ? ordersCount : undefined },
    { id: "offers", label: "Offers", icon: Tag },
  ];

  return (
    <aside className="w-[230px] shrink-0 bg-[#FFFFFF] border-r border-[#E8ECE9] py-5 px-3.5 space-y-2 sticky top-[84px] h-[calc(100vh-84px)] select-none hidden md:block">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full h-[46px] flex items-center justify-between px-3.5 rounded-[12px] text-sm transition-all cursor-pointer text-left ${
                isActive
                  ? "bg-[#EAF7EE] text-[#078B35] font-semibold"
                  : "bg-white text-[#4B5563] font-medium hover:bg-[#F9FAFB] hover:text-[#171717]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-[#078B35]" : "text-[#4B5563]"
                  }`}
                />
                <span className="leading-none text-[13.5px]">{item.label}</span>
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

