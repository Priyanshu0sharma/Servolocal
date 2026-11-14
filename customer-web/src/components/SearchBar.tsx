"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { ProductItem } from "@/types";

interface SearchBarProps {
  products: ProductItem[];
  onAddToCart?: (product: ProductItem) => void;
  onSelectProduct?: (product: ProductItem) => void;
}

const PLACEHOLDERS = [
  'Search "milk"',
  'Search "bread"',
  'Search "thums up"',
  'Search "chips"',
  'Search "paneer"',
  'Search "atta"',
  'Search "curd"',
  'Search "dettol"',
  'Search "maggi"',
];

const TRENDING_SUGGESTIONS = [
  "Milk",
  "Curd",
  "Bread",
  "Atta",
  "Chips",
  "Cold Drinks",
  "Paneer",
  "Maggi",
];

export default function SearchBar({
  products,
  onAddToCart,
  onSelectProduct,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const searchResults = searchQuery.trim().length >= 2
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < searchResults.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        const item = searchResults[selectedIndex];
        if (onSelectProduct) onSelectProduct(item);
        else if (onAddToCart) onAddToCart(item);
        setIsOpen(false);
        setSearchQuery("");
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#666666] absolute left-4 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="search-results-list"
          aria-label="Search fresh local products, groceries, and brands"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          className="w-full min-h-[42px] bg-[#FFFFFF] border border-[#E8ECE9] hover:border-[#078B35]/40 focus:border-[#078B35] rounded-[14px] pl-10 pr-9 py-2 text-xs sm:text-[13px] text-[#171717] placeholder:text-[#888888] placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[#078B35]/15 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-[#666666] hover:text-[#171717] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live Dropdown Results & Suggestions */}
      {isOpen && (
        <div
          id="search-results-list"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E8ECE9] rounded-2xl shadow-xl overflow-hidden z-50 max-h-84 overflow-y-auto divide-y divide-[#E8ECE9] animate-in fade-in zoom-in-95 duration-100"
        >
          {searchQuery.trim().length < 2 ? (
            /* Quick Trending Suggestions Strip */
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#666666]">
                <TrendingUp className="w-3.5 h-3.5 text-[#078B35]" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      setIsOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#F4F6F5] hover:bg-[#EAF7EE] hover:text-[#078B35] text-xs font-semibold text-[#2D2319] transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-[#078B35]/20"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? "bg-[#EAF7EE]" : "hover:bg-[#EAF7EE]/30"
                  }`}
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
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
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
                    aria-label={`Add ${item.name} to cart`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddToCart) onAddToCart(item);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#EAF7EE] hover:bg-[#078B35] text-[#078B35] hover:text-white border border-[#078B35]/25 text-[11px] font-bold transition-all shrink-0 cursor-pointer active:scale-95"
                  >
                    + ADD
                  </button>
                </div>
              );
            })
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

