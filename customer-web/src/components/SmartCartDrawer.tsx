"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Truck,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  CartItem,
  CartQuoteResponse,
  OrderCheckoutResponse,
  getCartQuote,
  checkoutOrder
} from "@/lib/api";

interface SmartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateCartQuantity: (inventoryId: number, newQty: number, variantId?: string) => void;
  onAddToCart: (product: any, variant?: any) => void;
  onOrderPlaced: (orderData: OrderCheckoutResponse["order"]) => void;
  currentLocality: string;
}

export default function SmartCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateCartQuantity,
  onAddToCart,
  onOrderPlaced,
  currentLocality,
}: SmartCartDrawerProps) {
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [address, setAddress] = useState(
    currentLocality.includes("Kukas")
      ? "Hostel Block A, Arya 1st Campus, Kukas, Jaipur"
      : `Main Street, ${currentLocality}`
  );
  const [paymentMethod, setPaymentMethod] = useState<"DIRECT_SHOP_UPI" | "RAZORPAY" | "COD">("DIRECT_SHOP_UPI");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [hasCelebratedFreeDelivery, setHasCelebratedFreeDelivery] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");

  // QR modal state for Direct Shop UPI
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [upiIntentData, setUpiIntentData] = useState<{ link?: string; amount?: number } | null>(null);

  // Fetch Cart Quote from backend whenever cart or coupon changes
  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null);
      return;
    }

    const shopId = cart[0].shop_id;
    const itemsPayload = cart.map((c) => ({
      inventory_id: c.inventory_id,
      quantity: c.quantity,
      variant_id: c.variant_id,
      pack_label: c.pack_label,
    }));

    setLoadingQuote(true);
    getCartQuote(shopId, itemsPayload, 27.0544, 75.8942, appliedCoupon || undefined)
      .then((data) => {
        setQuote(data);
        if (data.coupon_message) {
          setCouponMessage(data.coupon_message);
        }
        if (data.free_delivery_unlocked && !hasCelebratedFreeDelivery) {
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          } catch {}
          setHasCelebratedFreeDelivery(true);
        }
      })
      .catch(() => {
        // Fallback calculations if backend unavailable
        const itemsTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
        const freeUnlocked = itemsTotal >= 150;
        setQuote({
          shop_id: shopId,
          shop_name: cart[0].shop_name || "ServoLocal Verified Partner",
          items_total: itemsTotal,
          delivery_fee: freeUnlocked ? 0 : 25,
          platform_fee: 5,
          grand_total: itemsTotal + (freeUnlocked ? 0 : 25) + 5,
          free_delivery_threshold: 150,
          amount_needed_for_free_delivery: Math.max(0, 150 - itemsTotal),
          free_delivery_unlocked: freeUnlocked,
          progress_percent: Math.min(100, Math.round((itemsTotal / 150) * 100)),
          smart_upsells: [],
        });
      })
      .finally(() => setLoadingQuote(false));
  }, [cart, hasCelebratedFreeDelivery, appliedCoupon]);

  const handleApplyCoupon = async (codeToApply: string) => {
    if (!codeToApply.trim() || cart.length === 0) return;
    const clean = codeToApply.trim().toUpperCase();
    setLoadingQuote(true);
    try {
      const shopId = cart[0].shop_id;
      const itemsPayload = cart.map((c) => ({
        inventory_id: c.inventory_id,
        quantity: c.quantity,
        variant_id: c.variant_id,
        pack_label: c.pack_label,
      }));
      const data = await getCartQuote(shopId, itemsPayload, 27.0544, 75.8942, clean);
      setQuote(data);
      if (data.coupon_applied) {
        setAppliedCoupon(clean);
        setCouponMessage(data.coupon_message || `🎉 Coupon ${clean} applied!`);
        try {
          confetti({ particleCount: 40, spread: 50 });
        } catch {}
      } else {
        setCouponMessage(data.coupon_message || "Coupon cannot be applied to this order");
      }
    } catch {
      setCouponMessage("Failed to apply coupon");
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
  };


  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || !quote) return;
    if (!address.trim() || address.length < 5) {
      setCheckoutError("Please enter a complete delivery address.");
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutError("");

    try {
      const payload = {
        shop_id: quote.shop_id,
        items: cart.map((c) => ({
          inventory_id: c.inventory_id,
          quantity: c.quantity,
          variant_id: c.variant_id,
          pack_label: c.pack_label,
        })),
        delivery_address: address.trim(),
        delivery_lat: 27.0544,
        delivery_lng: 75.8942,
        payment_method: paymentMethod,
        customer_notes: "Leave package at front gate / reception",
        coupon_code: appliedCoupon || undefined,
      };

      const res = await checkoutOrder(payload);

      if (res.success && res.order) {
        try {
          confetti({ particleCount: 80, spread: 80 });
        } catch {}

        if (paymentMethod === "DIRECT_SHOP_UPI" && res.order.upi_intent_link) {
          // Show UPI modal or open UPI intent
          setUpiIntentData({ link: res.order.upi_intent_link, amount: res.order.grand_total });
          setShowUpiQrModal(true);
        }

        onOrderPlaced(res.order);
        onClose();
      }
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.detail || "Checkout failed. Please verify and retry.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-10"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900">
              My Order ({cart.length} {cart.length === 1 ? "Item" : "Items"})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liquid Free Delivery Progress Bar */}
        {quote && (
          <div className="bg-emerald-50/70 p-3.5 border-b border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-900">
                <Truck className="w-4 h-4 text-emerald-600" />
                {quote.free_delivery_unlocked ? (
                  <span className="font-black text-emerald-700">
                    🎉 FREE Delivery Unlocked!
                  </span>
                ) : (
                  <span>
                    Add <span className="text-emerald-700 font-black">₹{quote.amount_needed_for_free_delivery}</span> more for FREE Delivery
                  </span>
                )}
              </span>
              <span className="text-emerald-700 font-mono text-[11px]">
                {quote.progress_percent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-emerald-200/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${quote.progress_percent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore 15-min essentials and street favorites to fill your cart.
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={`${item.inventory_id}_${item.variant_id || "def"}`} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {item.name}
                        </h4>
                        {item.pack_label && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.pack_label}
                          </span>
                        )}
                        <p className="text-xs font-black text-slate-900 mt-0.5">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Counter Buttons */}
                    <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <button
                        onClick={() =>
                          onUpdateCartQuantity(item.inventory_id, item.quantity - 1, item.variant_id)
                        }
                        className="px-2 py-1 hover:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-slate-700" />
                      </button>
                      <span className="px-2 font-black text-xs font-mono text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateCartQuantity(item.inventory_id, item.quantity + 1, item.variant_id)
                        }
                        className="px-2 py-1 hover:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart Upsell Strip ("Frequently Bought Together") */}
              {quote?.smart_upsells && quote.smart_upsells.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Frequently Added Together</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quote.smart_upsells.slice(0, 4).map((up) => (
                      <div
                        key={up.id}
                        className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-1 shadow-2xs"
                      >
                        <div className="truncate">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {up.name}
                          </p>
                          <span className="text-[11px] font-black text-slate-900">
                            ₹{up.price}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onAddToCart({
                              id: up.id,
                              shop_id: quote.shop_id,
                              name: up.name,
                              selling_price: up.price,
                              mrp: up.mrp,
                              image_url: up.image_url,
                              weight_or_size: up.weight_or_size,
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white text-[10px] font-black border border-emerald-500/30 transition-all shrink-0"
                        >
                          + ADD
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Delivery Address & Instructions
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat, building, street, landmark..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Promo Coupon Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Apply Promo Code</span>
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME50, SERVO20"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(couponInput)}
                        disabled={!couponInput.trim() || loadingQuote}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput("WELCOME50");
                          handleApplyCoupon("WELCOME50");
                        }}
                        className="px-2 py-0.5 rounded-lg border border-dashed border-emerald-400 bg-emerald-50 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        WELCOME50 (₹50 OFF on ₹149)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput("SERVO20");
                          handleApplyCoupon("SERVO20");
                        }}
                        className="px-2 py-0.5 rounded-lg border border-dashed border-indigo-400 bg-indigo-50 text-[10px] font-bold text-indigo-800 hover:bg-indigo-100 transition-colors"
                      >
                        SERVO20 (₹20 OFF on ₹99)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{couponMessage || `Code '${appliedCoupon}' active`}</span>
                    </span>
                    <span className="font-black text-emerald-700">SAVED ₹{quote?.discount_amount?.toFixed(0) || "50"}</span>
                  </div>
                )}

                {couponMessage && !appliedCoupon && (
                  <p className="text-[11px] font-medium text-amber-700">
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* 3-Way Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Payment Rail
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("DIRECT_SHOP_UPI")}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      paymentMethod === "DIRECT_SHOP_UPI"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[10px] font-extrabold block leading-tight">
                      Direct UPI
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold block">
                      0% Fee
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("RAZORPAY")}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      paymentMethod === "RAZORPAY"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-[10px] font-extrabold block leading-tight">
                      Razorpay
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      Cards / Net
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      paymentMethod === "COD"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="text-[10px] font-extrabold block leading-tight">
                      Cash (COD)
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      At Doorstep
                    </span>
                  </button>
                </div>
              </div>

              {/* Bill Details Breakdown */}
              {quote && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Total</span>
                    <span>₹{quote.items_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Handling Fee</span>
                    <span>₹{quote.platform_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Delivery Fee</span>
                    {quote.free_delivery_unlocked ? (
                      <span className="text-emerald-600 font-extrabold">FREE</span>
                    ) : (
                      <span>₹{quote.delivery_fee.toFixed(2)}</span>
                    )}
                  </div>
                  {quote.discount_amount && quote.discount_amount > 0 ? (
                    <div className="flex justify-between items-center text-emerald-600 font-extrabold">
                      <span>Promo Discount ({quote.coupon_code || appliedCoupon})</span>
                      <span>-₹{quote.discount_amount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>To Pay</span>
                    <span>₹{quote.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {checkoutError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Checkout Button */}
        {cart.length > 0 && quote && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <button
              onClick={handleCheckout}
              disabled={isPlacingOrder}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-between px-5 active:scale-[0.99] disabled:opacity-50"
            >
              <div className="text-left">
                <span className="text-xs font-bold block opacity-90">
                  Pay via {paymentMethod === "DIRECT_SHOP_UPI" ? "Direct UPI" : paymentMethod}
                </span>
                <span className="text-base font-black">
                  ₹{quote.grand_total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isPlacingOrder ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Place 15-Min Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

