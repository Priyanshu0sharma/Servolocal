"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { ProductItem } from "@/types";

interface SearchBarProps {
  products: ProductItem[];
  onAddToCart?: (product: ProductItem) => void;
  onSelectProduct?: (product: ProductItem) => void;
}

export default function SearchBar({
  products,
  onAddToCart,
  onSelectProduct,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length >= 2
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[540px]">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#666666] absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for stores, products & more..."
          className="w-full bg-[#FFFFFF] border border-[#E8ECE9] hover:border-[#078B35]/40 focus:border-[#078B35] rounded-[14px] pl-10 pr-9 py-2.5 text-xs text-[#171717] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#078B35]/15 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 text-[#666666] hover:text-[#171717] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live Dropdown Results */}
      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E8ECE9] rounded-2xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-[#E8ECE9]">
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <div
                key={item.id}
                className="p-3 hover:bg-[#EAF7EE]/30 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(item);
                  else if (onAddToCart) onAddToCart(item);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] overflow-hidden shrink-0 border border-[#E8ECE9] p-1 flex items-center justify-center">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#171717] leading-tight truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#666666] mt-0.5 truncate">
                      {item.category} • {item.shop_name || "Local Store"}
                    </p>
                    <span className="text-xs font-extrabold text-[#171717]">
                      ₹{item.selling_price}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToCart) onAddToCart(item);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#EAF7EE] hover:bg-[#078B35] text-[#078B35] hover:text-white border border-[#078B35]/25 text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  + ADD
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#666666]">
              No items found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

