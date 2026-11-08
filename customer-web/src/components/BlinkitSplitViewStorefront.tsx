"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Store,
  Clock,
  Star,
  CheckCircle2,
  Plus,
  Minus,
  Filter,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { ProductItem, CartItem, ProductVariant } from "@/lib/api";
import { CATEGORIES_HIERARCHY, MasterProduct } from "@/lib/masterCatalogData";

interface BlinkitSplitViewStorefrontProps {
  categoryName?: string;
  shopName?: string;
  shopId?: number;
  allProducts: (ProductItem | MasterProduct)[];
  cart: CartItem[];
  onAddToCart: (product: any, variant?: ProductVariant) => void;
  onUpdateCartQuantity: (inventoryId: number, newQty: number, variantId?: string) => void;
  onClose: () => void;
  onSelectShop?: (shopName: string, shopId?: number) => void;
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
}: BlinkitSplitViewStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>("all");

  // Find matching category object from hierarchy
  const currentCategoryHierarchy = useMemo(() => {
    if (!categoryName) return null;
    return (
      CATEGORIES_HIERARCHY.find(
        (c) =>
          c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(c.name.toLowerCase())
      ) || null
    );
  }, [categoryName]);

  const subCategories = useMemo(() => {
    if (currentCategoryHierarchy) {
      return currentCategoryHierarchy.sub_categories;
    }
    // If shop view, build sub-categories from the shop's available products
    const uniqueSubs = Array.from(
      new Set(
        allProducts
          .filter((p) => (shopName ? (p.shop_name === shopName || p.shop_id === shopId) : true))
          .map((p) => p.sub_category || p.category)
          .filter(Boolean)
      )
    );
    return [
      { id: "all", name: "All Items", icon: "✨" },
      ...uniqueSubs.map((s, idx) => ({ id: `sub_${idx}`, name: s, icon: "🏷️" })),
    ];
  }, [currentCategoryHierarchy, allProducts, shopName, shopId]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // 1. Shop filter if active
      if (shopName && p.shop_name && !p.shop_name.toLowerCase().includes(shopName.toLowerCase())) {
        if (shopId && p.shop_id !== shopId) return false;
      }

      // 2. Category filter if active
      if (categoryName && !shopName) {
        const catMatch =
          p.category.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(p.category.toLowerCase());
        if (!catMatch) return false;
      }

      // 3. Sub-category filter
      if (selectedSubCatId !== "all") {
        const activeSubObj = subCategories.find((s) => s.id === selectedSubCatId);
        if (activeSubObj && p.sub_category) {
          const match =
            p.sub_category.toLowerCase().includes(activeSubObj.name.toLowerCase()) ||
            activeSubObj.name.toLowerCase().includes(p.sub_category.toLowerCase()) ||
            p.name.toLowerCase().includes(activeSubObj.name.toLowerCase());
          if (!match) return false;
        }
      }

      // 4. Search query inside view
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          ((p as any).brand && (p as any).brand.toLowerCase().includes(q)) ||
          p.category?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allProducts, shopName, shopId, categoryName, selectedSubCatId, searchQuery, subCategories]);

  // Safe fallback if sub-category has 0 items (never empty screen!)
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : allProducts.slice(0, 12);

  const getCartQuantity = (inventoryId: number, variantId?: string) => {
    const item = cart.find(
      (c) => c.inventory_id === inventoryId && (variantId ? c.variant_id === variantId : true)
    );
    return item ? item.quantity : 0;
  };

  const titleText = shopName
    ? shopName
    : categoryName || "All Essentials";

  return (
    <div className="w-full bg-white min-h-[600px] rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col select-none">
      {/* ── Top Bar with Back Button, Title & Search ───────────────── */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to All</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {titleText}
              </h2>
              {shopName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#0C831F] border border-emerald-200">
                  Verified Store
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {displayProducts.length} items available in stock
            </p>
          </div>
        </div>

        {/* In-View Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${titleText}...`}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F]"
          />
        </div>
      </div>

      {/* ── Split Layout: Left Sub-Category Sidebar & Right Product Grid ─ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sub-Category Sidebar */}
        <aside className="w-24 sm:w-36 bg-slate-50/70 border-r border-slate-100 p-1.5 sm:p-2 overflow-y-auto space-y-1 shrink-0">
          <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">
            Categories
          </div>
          {subCategories.map((sub) => {
            const isActive = selectedSubCatId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubCatId(sub.id)}
                className={`w-full text-left p-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 relative ${
                  isActive
                    ? "bg-white text-[#0C831F] font-black shadow-xs border-l-4 border-[#0C831F]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-base sm:text-sm">{sub.icon}</span>
                <span className="text-[10px] sm:text-xs text-center sm:text-left leading-tight line-clamp-2">
                  {sub.name}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Right Product Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-white max-h-[720px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayProducts.map((product) => {
              const qty = getCartQuantity(product.id);
              const displayPrice = product.selling_price || product.mrp;
              const discountPct =
                product.discount_percent ||
                (product.mrp > displayPrice
                  ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
                  : 0);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Centered Image with Veg & Discount Badge */}
                    <div className="w-full h-28 sm:h-32 rounded-xl bg-slate-50 relative mb-2 flex items-center justify-center p-2 border border-slate-100/60 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Veg dot */}
                      <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded border border-emerald-600 bg-white flex items-center justify-center p-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>

                      {/* Discount % OFF */}
                      {discountPct > 0 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[9px]">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    {/* Zomato-Style Shop Badge */}
                    <button
                      type="button"
                      onClick={() => onSelectShop && product.shop_name && onSelectShop(product.shop_name, product.shop_id || undefined)}
                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-emerald-50/90 hover:bg-emerald-100 text-[#0C831F] text-[9px] sm:text-[10px] font-black truncate flex items-center justify-between gap-1 mb-1.5 transition-colors cursor-pointer"
                      title={`Sold by ${product.shop_name || "Verified Store"}`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <Store className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{product.shop_name || "Sharma Kirana"}</span>
                      </span>
                      <span className="shrink-0 text-[8px] font-bold">
                        {product.local_eta_mins || "⚡ 10m"}
                      </span>
                    </button>

                    {/* Weight / Pack */}
                    <div className="text-[10px] font-extrabold text-slate-400 mb-0.5 uppercase">
                      {product.default_weight_or_size || (product as any).weight_or_size || "1 Unit"}
                    </div>

                    {/* Product Title */}
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug h-8">
                      {product.name}
                    </h4>
                  </div>

                  {/* Price & Blinkit ADD Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block leading-none">
                        ₹{displayPrice}
                      </span>
                      {product.mrp > displayPrice && (
                        <span className="text-[9px] text-slate-400 line-through">
                          ₹{product.mrp}
                        </span>
                      )}
                    </div>

                    {qty === 0 ? (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1 rounded-lg border-2 border-[#0C831F] bg-[#F7FFF9] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-black text-[11px] uppercase transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden shadow-xs">
                        <button
                          onClick={() => onUpdateCartQuantity(product.id, qty - 1)}
                          className="px-1.5 py-1 hover:bg-[#0A6D1A] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 font-black text-xs font-mono">{qty}</span>
                        <button
                          onClick={() => onUpdateCartQuantity(product.id, qty + 1)}
                          className="px-1.5 py-1 hover:bg-[#0A6D1A] transition-colors"
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
