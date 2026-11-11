"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  PhoneOff,
  DoorClosed,
  BellOff,
  CheckCircle2,
  ShieldCheck,
  Timer,
  Share2,
} from "lucide-react";
import { CartItem, UserProfile } from "@/types";
import { ActiveOrderData } from "./LiveOrderTrackerAndReview";
import { checkoutOrder } from "@/lib/api";

interface SmartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateCartQuantity: (inventoryId: number, qty: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: ActiveOrderData) => void;
  currentLocality: string;
  user?: UserProfile | null;
  onOpenSignIn?: () => void;
}

export default function SmartCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateCartQuantity,
  onClearCart,
  onOrderPlaced,
  currentLocality,
  user = null,
  onOpenSignIn,
}: SmartCartDrawerProps) {
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "COD">("UPI");
  const [deliveryInstruction, setDeliveryInstruction] = useState<string>("Leave at door");
  const [address, setAddress] = useState(`House/Flat 402, Main Road, ${currentLocality}`);
  const [isPlacing, setIsPlacing] = useState(false);

  if (!isOpen) return null;

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeDelivery = itemsTotal >= 150;
  const deliveryFee = itemsTotal === 0 ? 0 : isFreeDelivery ? 0 : 25;
  const handlingFee = itemsTotal === 0 ? 0 : 5;
  const grandTotal = itemsTotal + deliveryFee + handlingFee;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const deliveringShop = cart[0]?.shop_name || "Sharma Kirana & Supermart";

  const handleCheckout = async () => {
    // If not logged in, trigger login popup instead of placing order
    if (!user) {
      if (onOpenSignIn) {
        onOpenSignIn();
      }
      return;
    }

    setIsPlacing(true);
    let orderCode = "SL-" + Math.floor(100000 + Math.random() * 900000);
    let deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    let pickupPin = String(Math.floor(1000 + Math.random() * 9000));

    try {
      const targetShopId = cart[0]?.shop_id || 1;
      const dbRes = await checkoutOrder({
        shop_id: targetShopId,
        items: cart.map((c) => ({
          inventory_id: c.inventory_id,
          quantity: c.quantity,
        })),
        delivery_address: address,
        payment_method: paymentMethod,
      });
      if (dbRes?.order_code) {
        orderCode = dbRes.order_code;
        if (dbRes.delivery_pin) deliveryPin = String(dbRes.delivery_pin);
        if (dbRes.pickup_pin) pickupPin = String(dbRes.pickup_pin);
      }
    } catch {}

    const newOrder: ActiveOrderData = {
      id: "ord_" + Date.now(),
      orderCode,
      status: "PLACED",
      shopName: deliveringShop,
      shopLocality: currentLocality,
      deliveryAddress: address,
      grandTotal,
      deliveryPin,
      pickupPin,
      itemsCount: cart.length,
    };

    setIsPlacing(false);
    onOrderPlaced(newOrder);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-2xs select-none">
      <div className="w-full max-w-md h-full bg-[#F5F7F8] shadow-2xl flex flex-col justify-between border-l border-[#E8ECE9] animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header (Exact Blinkit Style) */}
        <div className="p-4 bg-white border-b border-[#E8ECE9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[#171717] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#171717]">My Cart</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#666666] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {cart.length === 0 ? (
            <div className="py-24 text-center space-y-2 bg-white rounded-2xl p-6 m-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-[#171717]">Your Cart is Empty</p>
              <p className="text-xs text-[#666666]">
                Explore fresh local items delivered in 10-15 minutes
              </p>
            </div>
          ) : (
            <>
              {/* Delivery ETA Card (Blinkit Signature) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#EAF7EE] text-[#078B35] flex items-center justify-center">
                    <Timer className="w-4 h-4 text-[#078B35]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#171717]">Delivery in 10-15 minutes</h4>
                    <p className="text-[11px] text-[#666666]">
                      Shipment of {totalItemsCount} item{totalItemsCount > 1 ? "s" : ""} from {deliveringShop}
                    </p>
                  </div>
                </div>

                {/* Items in this shipment */}
                <div className="mt-3 pt-3 border-t border-[#F2F4F5] space-y-3">
                  {cart.map((item) => (
                    <div key={item.inventory_id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] border border-[#E8ECE9] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#171717] truncate leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-[#888888] mt-0.5">
                            {item.unit || "1 Unit"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-[#171717]">₹{item.price}</span>
                            {item.mrp && item.mrp > item.price && (
                              <span className="text-[10px] text-[#999999] line-through">
                                ₹{item.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Pill */}
                      <div className="flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQuantity(item.inventory_id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-[#075C2A] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateCartQuantity(item.inventory_id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-[#075C2A] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Delivery Meter */}
              <div className="p-3 rounded-2xl bg-white border border-[#E8ECE9] text-xs shadow-2xs">
                {isFreeDelivery ? (
                  <div className="flex items-center gap-1.5 text-[#075C2A] font-bold">
                    <span>🎉</span>
                    <span>Free delivery unlocked on this order!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[#075C2A] font-medium text-[11px]">
                      <span>Add ₹{(150 - itemsTotal).toFixed(0)} more for FREE Delivery</span>
                      <span>₹{itemsTotal} / ₹150</span>
                    </div>
                    <div className="w-full bg-[#078B35]/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#078B35] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (itemsTotal / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Address, Instructions & Payment Methods: ONLY visible AFTER login */}
              {user && (
                <>
                  {/* Delivery Instructions */}
                  <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] space-y-2 shadow-2xs">
                    <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                      Delivery Instructions
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "Leave at door", label: "Leave at Door", icon: DoorClosed },
                        { id: "Avoid calling", label: "Avoid Calling", icon: PhoneOff },
                        { id: "Don't ring bell", label: "Don't Ring Bell", icon: BellOff },
                      ].map((inst) => {
                        const Icon = inst.icon;
                        const isSelected = deliveryInstruction === inst.id;
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => setDeliveryInstruction(inst.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#0C831F] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                                : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#0C831F]" />
                            <span className="text-[10px] block leading-tight">{inst.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] space-y-1.5 shadow-2xs">
                    <label className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E8ECE9] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#0C831F]"
                    />
                  </div>

                  {/* Payment Methods */}
                  <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] space-y-2 shadow-2xs">
                    <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                      Payment Method
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("UPI")}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === "UPI"
                            ? "border-[#0C831F] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                            : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5 mx-auto mb-1 text-[#0C831F]" />
                        <span className="text-[10px] block">UPI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CARD")}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === "CARD"
                            ? "border-[#0C831F] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                            : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-[#0C831F]" />
                        <span className="text-[10px] block">Card / Net</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("COD")}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === "COD"
                            ? "border-[#0C831F] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                            : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 mx-auto mb-1 text-[#0C831F]" />
                        <span className="text-[10px] block">COD</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Bill Details Breakdown (Exact Blinkit Style) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] space-y-2 text-xs shadow-2xs">
                <h4 className="font-bold text-[#171717] text-xs">Bill details</h4>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[#666666]">
                    <span>Items total</span>
                    <span className="font-semibold text-[#171717]">₹{itemsTotal}</span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>Delivery charge</span>
                    <span>
                      {isFreeDelivery ? (
                        <strong className="text-[#0C831F]">FREE</strong>
                      ) : (
                        <strong className="text-[#171717]">₹{deliveryFee}</strong>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>Handling charge</span>
                    <span className="font-semibold text-[#171717]">₹{handlingFee}</span>
                  </div>
                  <div className="pt-2 border-t border-[#F2F4F5] flex justify-between font-bold text-sm text-[#171717]">
                    <span>Grand total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy (Exact Blinkit Style) */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E8ECE9] space-y-1 text-xs shadow-2xs">
                <h4 className="font-bold text-[#171717] text-xs">Cancellation Policy</h4>
                <p className="text-[11px] text-[#777777] leading-relaxed">
                  Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Checkout Button (Exact Blinkit Behavior) */}
        {cart.length > 0 && (
          <div className="p-3 bg-white border-t border-[#E8ECE9]">
            <button
              type="button"
              disabled={isPlacing}
              onClick={handleCheckout}
              className="w-full py-3 rounded-xl bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-md flex items-center justify-between px-4 cursor-pointer disabled:opacity-50"
            >
              <div className="text-left">
                <span className="text-sm font-black">₹{grandTotal}</span>
                <span className="text-[10px] opacity-90 uppercase tracking-wider block font-bold">
                  TOTAL
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {!user ? (
                  <>
                    <span>Login to Proceed</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : isPlacing ? (
                  <span>Placing Order with Store...</span>
                ) : (
                  <>
                    <span>Place 10-Min Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
