"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Store,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { ProductItem, CartItem } from "@/types";
import { CATEGORIES_HIERARCHY, MasterProduct } from "@/lib/masterCatalogData";

interface BlinkitSplitViewStorefrontProps {
  categoryName?: string | null;
  shopName?: string | null;
  shopId?: number | null;
  allProducts: (ProductItem | MasterProduct)[];
  cart: CartItem[];
  onAddToCart: (product: any) => void;
  onUpdateCartQuantity: (inventoryId: number, qty: number) => void;
  onClose: () => void;
  onSelectShop?: (shopName: string, shopId?: number) => void;
  onSelectProduct?: (product: ProductItem) => void;
}

export default function BlinkitSplitViewStorefront({
  categoryName,
  shopName,
  shopId,
  allProducts,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onClose,
  onSelectShop,
  onSelectProduct,
}: BlinkitSplitViewStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>("all");

  // Find matching category hierarchy if categoryName is provided
  const currentHierarchy = useMemo(() => {
    if (!categoryName) return null;
    return (
      CATEGORIES_HIERARCHY.find(
        (c) =>
          c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(c.name.toLowerCase())
      ) || null
    );
  }, [categoryName]);

  // Build sub-categories for left aisle sidebar
  const subCategories = useMemo(() => {
    if (currentHierarchy) {
      return currentHierarchy.sub_categories;
    }
    // If shop view, extract unique sub-categories from products of this shop
    const uniqueSubs = Array.from(
      new Set(
        allProducts
          .filter((p) => (shopName ? p.shop_name === shopName || p.shop_id === shopId : true))
          .map((p) => p.sub_category || p.category)
          .filter(Boolean)
      )
    );
    return [
      { id: "all", name: "All Items", icon: "✨" },
      ...uniqueSubs.map((s, idx) => ({ id: `sub_${idx}`, name: s, icon: "🏷️" })),
    ];
  }, [currentHierarchy, allProducts, shopName, shopId]);

  // Filter products by shop, category, subcategory and search query
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // 1. Shop filter if active
      if (shopName) {
        const matchShop =
          (p.shop_name && p.shop_name.toLowerCase().includes(shopName.toLowerCase())) ||
          (shopId && p.shop_id === shopId);
        if (!matchShop) return false;
      }

      // 2. Category filter if active and not shop-specific
      if (categoryName && !shopName) {
        const catMatch =
          p.category.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(p.category.toLowerCase());
        if (!catMatch) return false;
      }

      // 3. Sub-category filter
      if (selectedSubCatId !== "all") {
        const activeSubObj = subCategories.find((s) => s.id === selectedSubCatId);
        if (activeSubObj) {
          const matchSub =
            (p.sub_category &&
              (p.sub_category.toLowerCase().includes(activeSubObj.name.toLowerCase()) ||
                activeSubObj.name.toLowerCase().includes(p.sub_category.toLowerCase()))) ||
            p.name.toLowerCase().includes(activeSubObj.name.toLowerCase());
          if (!matchSub) return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [allProducts, shopName, shopId, categoryName, selectedSubCatId, searchQuery, subCategories]);

  // Safe fallback if 0 items so user never sees a blank screen
  const displayProducts =
    filteredProducts.length > 0 ? filteredProducts : allProducts.slice(0, 12);

  const getCartQuantity = (inventoryId: number) => {
    const item = cart.find((c) => c.inventory_id === inventoryId);
    return item ? item.quantity : 0;
  };

  const titleText = shopName
    ? shopName
    : categoryName || "All Local Essentials";

  return (
    <div className="w-full bg-white rounded-3xl border border-[#E8ECE9] shadow-sm overflow-hidden flex flex-col select-none animate-in fade-in duration-200">
      
      {/* ── Top Bar with Back Button, Title & Search ──────────────── */}
      <div className="p-3.5 sm:p-4 bg-white border-b border-[#E8ECE9] flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#EAF7EE] text-[#171717] hover:text-[#078B35] transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[#171717] leading-tight">
                {titleText}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#078B35] text-[10px] font-bold">
                ⚡ 10-15m
              </span>
            </div>
            <p className="text-[11px] text-[#666666]">
              {filteredProducts.length} items available from local shops
            </p>
          </div>
        </div>

        {/* In-Store Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${titleText}...`}
            className="w-full bg-[#F8F9FA] border border-[#E8ECE9] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#171717] placeholder:text-[#666666] focus:outline-none focus:border-[#078B35]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#171717] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Split View Body: Left Aisles + Right Products Grid ── */}
      <div className="flex flex-1 min-h-[520px]">
        
        {/* Left Column: Sub-Category / Aisle Sidebar */}
        <div className="w-40 sm:w-56 shrink-0 border-r border-[#E8ECE9] bg-[#FBFDFB] p-2.5 space-y-1 overflow-y-auto max-h-[750px]">
          <span className="text-[10px] font-bold text-[#666666] px-2 py-1 block uppercase tracking-wider">
            Aisles & Categories
          </span>
          {subCategories.map((sub) => {
            const isActive = selectedSubCatId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubCatId(sub.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#EAF7EE] text-[#078B35] font-bold border border-[#078B35]/25 shadow-2xs"
                    : "text-[#4B5563] hover:bg-[#F0FAF3] hover:text-[#171717]"
                }`}
              >
                <span className="text-sm">{sub.icon}</span>
                <span className="truncate leading-tight">{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Blinkit Product Grid */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto max-h-[750px] bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayProducts.map((product) => {
              const qty = getCartQuantity(product.id);
              const displayPrice = product.selling_price;
              const discountPct =
                product.mrp > displayPrice
                  ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct && onSelectProduct(product as ProductItem)}
                  className="bg-white rounded-2xl border border-[#E8ECE9] p-3 flex flex-col justify-between hover:shadow-md transition-shadow group relative cursor-pointer"
                >
                  <div>
                    {/* Centered Image with Veg & Discount Badge */}
                    <div className="w-full h-28 sm:h-32 rounded-xl bg-[#F8F9FA] relative mb-2 flex items-center justify-center p-2 border border-[#E8ECE9]/60 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Veg dot */}
                      <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded border border-[#078B35] bg-white flex items-center justify-center p-0.5 shadow-2xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#078B35]" />
                      </div>

                      {/* Discount % OFF */}
                      {discountPct > 0 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#075C2A] text-white font-extrabold text-[9px]">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    {/* Local Store Badge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectShop && product.shop_name) {
                          onSelectShop(product.shop_name, product.shop_id);
                        }
                      }}
                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-[#EAF7EE] hover:bg-[#d6f0dd] text-[#075C2A] text-[9.5px] font-bold truncate flex items-center justify-between gap-1 mb-1 transition-colors cursor-pointer"
                      title={`Sold by ${product.shop_name || "Verified Local Store"}`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <Store className="w-2.5 h-2.5 shrink-0 text-[#078B35]" />
                        <span className="truncate">{product.shop_name || "Local Store"}</span>
                      </span>
                      <span className="shrink-0 text-[8.5px] font-bold text-[#078B35]">
                        {product.local_eta_mins || "⚡ 10m"}
                      </span>
                    </button>

                    {/* Weight / Pack size */}
                    <div className="text-[10px] font-bold text-[#666666] mb-0.5 uppercase">
                      {(product as any).default_weight_or_size ||
                        (product as any).weight_or_size ||
                        "1 Unit"}
                    </div>

                    {/* Product Title */}
                    <h4 className="font-semibold text-xs text-[#171717] line-clamp-2 leading-snug h-8 hover:text-[#078B35] transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  {/* Price & Blinkit ADD Button */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 pt-2 border-t border-[#E8ECE9] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#171717] block leading-none">
                        ₹{displayPrice}
                      </span>
                      {product.mrp > displayPrice && (
                        <span className="text-[10px] text-[#666666] line-through">
                          ₹{product.mrp}
                        </span>
                      )}
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1 rounded-lg border border-[#078B35] bg-[#EAF7EE] hover:bg-[#078B35] text-[#078B35] hover:text-white font-bold text-[11px] uppercase transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center bg-[#078B35] text-white rounded-lg overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQuantity(product.id, qty - 1)}
                          className="px-1.5 py-1 hover:bg-[#075C2A] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs font-mono">{qty}</span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="px-1.5 py-1 hover:bg-[#075C2A] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

