"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Sparkles,
  Store,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Star,
  CheckCircle2,
  X,
  Layers,
  ArrowRight
} from "lucide-react";
import { ProductItem, ShopItem, ProductVariant, CartItem } from "@/lib/api";

interface ProductCardAndRailsProps {
  title: string;
  badge?: string;
  products?: ProductItem[];
  shops?: ShopItem[];
  cart: CartItem[];
  onAddToCart: (product: ProductItem, variant?: ProductVariant) => void;
  onUpdateCartQuantity: (inventoryId: number, newQty: number, variantId?: string) => void;
}

// ── In-Card Product Component with Photo Swipe Carousel ─────────────────────
function SingleProductCard({
  product,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onSelectVariants,
}: {
  product: ProductItem;
  cart: CartItem[];
  onAddToCart: (product: ProductItem, variant?: ProductVariant) => void;
  onUpdateCartQuantity: (inventoryId: number, newQty: number, variantId?: string) => void;
  onSelectVariants: (product: ProductItem) => void;
}) {
  const images =
    product.gallery_images && product.gallery_images.length > 0
      ? product.gallery_images
      : [product.image_url];
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const getCartQuantity = (inventoryId: number, variantId?: string) => {
    const item = cart.find(
      (c) => c.inventory_id === inventoryId && (variantId ? c.variant_id === variantId : true)
    );
    return item ? item.quantity : 0;
  };

  const qty = getCartQuantity(product.id);
  const hasVariants = product.variants && product.variants.length > 1;
  const displayPrice = product.selling_price || product.mrp;
  const discountPct =
    product.discount_percent ||
    (product.mrp > displayPrice
      ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
      : 0);

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-40 sm:w-44 shrink-0 bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group select-none">
      {/* Product Top Image Box with Carousel */}
      <div>
        <div className="w-full h-32 sm:h-36 rounded-2xl bg-slate-50 overflow-hidden relative mb-2.5 flex items-center justify-center border border-slate-100/60">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImgIndex}
              src={images[activeImgIndex]}
              alt={product.name}
              initial={{ opacity: 0.7, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          </AnimatePresence>

          {/* In-Card Photo Carousel Navigation (when 2+ images exist) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImg}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow text-slate-700 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextImg}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow text-slate-700 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center gap-1 pointer-events-none">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeImgIndex ? "w-3 bg-emerald-600" : "w-1.5 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Veg / Non-Veg Green Dot Icon */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded border border-emerald-600 bg-white flex items-center justify-center p-0.5 shadow-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>

          {/* Discount Badge */}
          {discountPct > 0 && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-[9px] shadow-xs">
              {discountPct}% OFF
            </span>
          )}

          {/* Low Stock Indicator with Pulsing Alert */}
          {product.available_stock > 0 && product.available_stock <= 5 && (
            <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black animate-pulse">
              Only {product.available_stock} left!
            </span>
          )}
        </div>

        {/* Weight / Pack Badge */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase">
            {product.weight_or_size || "1 Unit"}
          </span>
          {hasVariants && (
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
              {product.variants?.length} Options
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug h-8">
          {product.name}
        </h3>
      </div>

      {/* Price & Spring-Morphing Add Button */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-50">
        <div>
          <span className="text-xs sm:text-sm font-black text-slate-900 block leading-none">
            ₹{displayPrice}
          </span>
          {product.mrp > displayPrice && (
            <span className="text-[10px] text-slate-400 line-through">
              ₹{product.mrp}
            </span>
          )}
        </div>

        {/* Spring Animated Morphing Button: + ADD <--> [- 1 +] */}
        {hasVariants ? (
          <button
            onClick={() => onSelectVariants(product)}
            className="px-3 py-1.5 rounded-lg border-2 border-[#0C831F] bg-[#F7FFF9] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-extrabold text-[11px] uppercase transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            OPTIONS
          </button>
        ) : qty === 0 ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(product)}
            className="px-4 py-1.5 rounded-lg border-2 border-[#0C831F] bg-[#F7FFF9] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-extrabold text-xs uppercase transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            ADD
          </motion.button>
        ) : (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => onUpdateCartQuantity(product.id, qty - 1)}
              className="px-2 py-1.5 hover:bg-[#0A6D1A] transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-black text-xs font-mono">{qty}</span>
            <button
              onClick={() => onUpdateCartQuantity(product.id, qty + 1)}
              className="px-2 py-1.5 hover:bg-[#0A6D1A] transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main Rail Container ─────────────────────────────────────────────────────
export default function ProductCardAndRails({
  title,
  badge,
  products = [],
  shops = [],
  cart,
  onAddToCart,
  onUpdateCartQuantity,
}: ProductCardAndRailsProps) {
  // Variant modal state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<ProductItem | null>(null);

  const getCartQuantity = (inventoryId: number, variantId?: string) => {
    const item = cart.find(
      (c) => c.inventory_id === inventoryId && (variantId ? c.variant_id === variantId : true)
    );
    return item ? item.quantity : 0;
  };

  return (
    <section className="py-4 select-none">
      {/* ── Rail Header (Blinkit Style) ─────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              {badge}
            </span>
          )}
        </div>
        <span className="text-xs sm:text-sm font-extrabold text-[#0C831F] hover:underline cursor-pointer">
          see all
        </span>
      </div>

      {/* ── Horizontal Scroll Container ────────────────────────────── */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0">
        {/* Render Shops Rail if provided */}
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="w-64 sm:w-72 shrink-0 bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative mb-3">
                <img
                  src={shop.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{shop.local_eta_mins || "15-20 mins"}</span>
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-slate-900 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{shop.rating || 4.5}</span>
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                {shop.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {shop.category} • {shop.locality_name}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                {shop.is_scheduled_route ? "Scheduled Route" : `${shop.distance_km.toFixed(1)} km away`}
              </span>
              <span
                className={`font-black ${
                  shop.is_open ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {shop.is_open ? "OPEN NOW" : "CLOSED"}
              </span>
            </div>
          </div>
        ))}

        {/* Render Single Product Cards with Photo Swipe Carousels */}
        {products.map((product) => (
          <SingleProductCard
            key={product.id}
            product={product}
            cart={cart}
            onAddToCart={onAddToCart}
            onUpdateCartQuantity={onUpdateCartQuantity}
            onSelectVariants={(p) => setSelectedProductForVariants(p)}
          />
        ))}
      </div>

      {/* ── Multi-Pack Variant Selector Modal (Screenshot 2 Replica) ── */}
      <AnimatePresence>
        {selectedProductForVariants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100"
            >
              {/* Close Button at Top */}
              <button
                onClick={() => setSelectedProductForVariants(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <h3 className="font-black text-sm text-slate-900 mb-4 pr-4">
                {selectedProductForVariants.name}
              </h3>

              {/* Variant Rows List */}
              <div className="space-y-2.5">
                {(selectedProductForVariants.variants || []).map((variant) => {
                  const varQty = getCartQuantity(selectedProductForVariants.id, variant.id);

                  return (
                    <div
                      key={variant.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:border-emerald-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 p-1 shrink-0 overflow-hidden relative">
                          <img
                            src={selectedProductForVariants.image_url}
                            alt={variant.weight_or_size}
                            className="w-full h-full object-contain"
                          />
                          {variant.discount_pct > 0 && (
                            <span className="absolute top-0 left-0 px-1 py-0.2 bg-indigo-600 text-white text-[8px] font-black rounded-br">
                              {variant.discount_pct}% OFF
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {variant.weight_or_size}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-slate-900">
                              ₹{variant.price}
                            </span>
                            {variant.mrp > variant.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{variant.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variant Action Button */}
                      {varQty === 0 ? (
                        <button
                          onClick={() => {
                            onAddToCart(selectedProductForVariants, variant);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-emerald-500 bg-white hover:bg-emerald-500 text-emerald-600 hover:text-white font-black text-xs transition-all active:scale-95 shadow-sm"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center bg-emerald-500 text-white rounded-xl overflow-hidden shadow-sm">
                          <button
                            onClick={() =>
                              onUpdateCartQuantity(
                                selectedProductForVariants.id,
                                varQty - 1,
                                variant.id
                              )
                            }
                            className="px-2 py-1.5 hover:bg-emerald-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-black text-xs font-mono">{varQty}</span>
                          <button
                            onClick={() =>
                              onUpdateCartQuantity(
                                selectedProductForVariants.id,
                                varQty + 1,
                                variant.id
                              )
                            }
                            className="px-2 py-1.5 hover:bg-emerald-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Done button */}
              <button
                onClick={() => setSelectedProductForVariants(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
