"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  CreditCard,
  Banknote,
  QrCode,
  Store,
  Clock,
  PhoneOff,
  DoorClosed,
  BellOff,
  ShieldCheck,
} from "lucide-react";
import { CartItem } from "@/types";
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
}

export default function SmartCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateCartQuantity,
  onClearCart,
  onOrderPlaced,
  currentLocality,
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

  const deliveringShop = cart[0]?.shop_name || "Sharma Kirana & Supermart";

  const handleCheckout = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/45 backdrop-blur-2xs select-none">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#E8ECE9] animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E8ECE9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#171717]">My Cart</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#078B35] text-[10px] font-bold">
                  ⚡ 10-15m
                </span>
              </div>
              <p className="text-[11px] text-[#666666]">
                From {deliveringShop}
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-[#171717]">Your Cart is Empty</p>
              <p className="text-xs text-[#666666]">
                Explore fresh local items delivered in 10-15 minutes
              </p>
            </div>
          ) : (
            <>
              {/* Free Delivery Meter */}
              <div className="p-3 rounded-2xl bg-[#EAF7EE] border border-[#078B35]/25 text-xs">
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

              {/* Items List */}
              <div className="space-y-2 divide-y divide-[#E8ECE9]">
                {cart.map((item) => (
                  <div key={item.inventory_id} className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#F8F9FA] border border-[#E8ECE9] p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#171717] truncate">{item.name}</h4>
                        <p className="text-[11px] text-[#666666]">₹{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-[#078B35] text-white rounded-lg overflow-hidden shadow-2xs">
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

              {/* Delivery Instructions (Blinkit Signature) */}
              <div className="space-y-1.5 pt-1">
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
                            ? "border-[#078B35] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                            : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#078B35]" />
                        <span className="text-[10px] block leading-tight">{inst.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E8ECE9] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#078B35]"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "border-[#078B35] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                        : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 mx-auto mb-1 text-[#078B35]" />
                    <span className="text-[10px] block">UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "border-[#078B35] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                        : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-[#078B35]" />
                    <span className="text-[10px] block">Card / Net</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === "COD"
                        ? "border-[#078B35] bg-[#EAF7EE] text-[#075C2A] font-bold shadow-2xs"
                        : "border-[#E8ECE9] bg-white text-[#666666] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 mx-auto mb-1 text-[#078B35]" />
                    <span className="text-[10px] block">COD</span>
                  </button>
                </div>
              </div>

              {/* Bill Details Breakdown */}
              <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8ECE9] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Items Total</span>
                  <span>₹{itemsTotal}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Delivery Partner Fee</span>
                  <span>
                    {isFreeDelivery ? (
                      <strong className="text-[#078B35]">FREE</strong>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Handling Fee</span>
                  <span>₹{handlingFee}</span>
                </div>
                <div className="pt-2 border-t border-[#E8ECE9] flex justify-between font-bold text-sm text-[#171717]">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#E8ECE9] bg-white">
            <button
              type="button"
              disabled={isPlacing}
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-md flex items-center justify-between px-4 cursor-pointer disabled:opacity-50"
            >
              <div className="text-left">
                <span className="text-[10px] opacity-90 block">
                  Pay via {paymentMethod === "UPI" ? "UPI QR" : paymentMethod}
                </span>
                <span className="text-sm font-black">₹{grandTotal}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>{isPlacing ? "Placing Order with Store..." : "Place 10-Min Order"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
