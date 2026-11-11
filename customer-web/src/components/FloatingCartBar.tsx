"use client";

import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { CartItem } from "@/types";

interface FloatingCartBarProps {
  cart: CartItem[];
  onOpenCart: () => void;
  currentLocality: string;
}

export default function FloatingCartBar({
  cart,
  onOpenCart,
  currentLocality,
}: FloatingCartBarProps) {
  if (cart.length === 0) return null;

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-200">
      <div
        onClick={onOpenCart}
        className="w-full bg-[#078B35] hover:bg-[#075C2A] text-white p-3.5 sm:px-5 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] select-none border border-emerald-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-tight">
              {totalCount} {totalCount === 1 ? "Item" : "Items"} • ₹{itemsTotal}
            </span>
            <span className="text-[11px] text-emerald-100 font-medium leading-none">
              From local stores to {currentLocality}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white text-[#078B35] px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-50 transition-colors">
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

