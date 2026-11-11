"use client";

import React from "react";
import { X, Heart, ShoppingBag } from "lucide-react";
import { ProductItem } from "@/types";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistedProducts: ProductItem[];
  onRemoveFromWishlist: (productId: number) => void;
  onAddToCart: (product: ProductItem) => void;
}

export default function WishlistModal({
  isOpen,
  onClose,
  wishlistedProducts,
  onRemoveFromWishlist,
  onAddToCart,
}: WishlistModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E8ECE9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8ECE9]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="text-sm font-bold text-[#171717]">Saved Items ({wishlistedProducts.length})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#666666] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-[#E8ECE9]">
          {wishlistedProducts.length > 0 ? (
            wishlistedProducts.map((p) => (
              <div key={p.id} className="pt-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#F8F9FA] border border-[#E8ECE9] p-1 shrink-0 flex items-center justify-center">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#171717] truncate">{p.name}</h4>
                    <p className="text-xs font-bold text-[#171717]">₹{p.selling_price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(p);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#078B35] text-white font-bold text-[11px] hover:bg-[#075C2A] transition-all cursor-pointer"
                  >
                    + ADD
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFromWishlist(p.id)}
                    className="p-1 text-[#666666] hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#666666] space-y-2">
              <Heart className="w-10 h-10 mx-auto text-slate-200 stroke-1" />
              <p className="text-xs font-bold text-[#171717]">Your wishlist is empty</p>
              <p className="text-[11px] text-[#666666]">
                Tap the heart on any product to save it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

