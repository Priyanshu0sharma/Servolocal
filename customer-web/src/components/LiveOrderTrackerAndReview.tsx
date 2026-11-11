"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  CheckCircle2,
  Clock,
  Star,
  Sparkles,
  Phone,
  ShieldCheck,
  X,
  Send,
  Loader2,
  Bike,
  KeyRound,
} from "lucide-react";

export interface ActiveOrderData {
  id: string;
  orderCode: string;
  status: "PLACED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  shopName: string;
  shopLocality: string;
  deliveryAddress: string;
  grandTotal: number;
  deliveryPin: string;
  pickupPin: string;
  itemsCount: number;
}

interface LiveOrderTrackerAndReviewProps {
  order: ActiveOrderData;
  onClose: () => void;
}

const ORDER_STEPS = [
  { key: "PLACED", label: "Order Placed", desc: "Confirmed with local shop" },
  { key: "PACKING", label: "Store Packing", desc: "Items packed with care" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Rider on the way" },
  { key: "DELIVERED", label: "Delivered", desc: "Handover at your doorstep" },
];

export default function LiveOrderTrackerAndReview({
  order,
  onClose,
}: LiveOrderTrackerAndReviewProps) {
  const [currentStatus, setCurrentStatus] = useState<ActiveOrderData["status"]>(order.status || "PLACED");
  const [etaMins, setEtaMins] = useState(12);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [shopRating, setShopRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Auto-advance simulated live demo stages for realistic 10-15m Blinkit experience
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStatus("PACKING");
      setEtaMins(9);
    }, 4500);

    const timer2 = setTimeout(() => {
      setCurrentStatus("OUT_FOR_DELIVERY");
      setEtaMins(5);
    }, 11000);

    const timer3 = setTimeout(() => {
      setCurrentStatus("DELIVERED");
      setEtaMins(0);
      setShowReview(true);
    }, 20000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const getStepIndex = (status: ActiveOrderData["status"]) => {
    switch (status) {
      case "DELIVERED":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 2;
      case "PACKING":
        return 1;
      case "PLACED":
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(currentStatus);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowReview(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs select-none overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E8ECE9] relative my-6 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8ECE9]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#075C2A] bg-[#EAF7EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#078B35] animate-ping" />
              <span>Live 10-15 Min Delivery</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#171717]">
              #{order.orderCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#666666] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big ETA Countdown Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-[#075C2A] to-[#078B35] text-white flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-emerald-100 block">
              {currentStatus === "DELIVERED"
                ? "Order Delivered!"
                : "Arriving at Doorstep in"}
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              {currentStatus === "DELIVERED"
                ? "Enjoy your local goods!"
                : `⚡ ${etaMins} Minutes`}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
            <Bike className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        {/* 4-Step Blinkit Live Tracker */}
        <div className="py-2 space-y-4">
          <div className="relative flex justify-between items-center px-2">
            {/* Background progress line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#E8ECE9] -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#078B35] -z-0 transition-all duration-700"
              style={{ width: `${(currentStep / 3) * 85}%` }}
            />

            {ORDER_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-[#078B35] text-white shadow-xs"
                        : "bg-white text-[#666666] border border-[#E8ECE9]"
                    } ${isCurrent ? "ring-4 ring-[#078B35]/20 scale-110" : ""}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-semibold text-center max-w-[65px] leading-tight ${
                      isCompleted ? "text-[#078B35] font-bold" : "text-[#666666]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery OTP Security PIN */}
        <div className="my-3 p-3.5 rounded-2xl bg-[#EAF7EE] border border-[#078B35]/25 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#078B35] text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#075C2A] uppercase block">
                Doorstep Delivery PIN
              </span>
              <span className="text-base font-black text-[#171717] tracking-widest font-mono">
                {order.deliveryPin}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#075C2A] font-medium max-w-[170px] text-right">
            Share this with the delivery rider to receive your parcel
          </span>
        </div>

        {/* Store & Rider Details */}
        <div className="space-y-2 pt-1 border-t border-[#E8ECE9] text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E8ECE9]">
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 text-[#078B35] shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-[#171717] block truncate">
                  {order.shopName}
                </span>
                <span className="text-[10px] text-[#666666] block truncate">
                  {order.shopLocality}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E8ECE9] text-[#171717] font-semibold text-[11px] flex items-center gap-1 hover:bg-[#EAF7EE] hover:text-[#078B35] cursor-pointer"
            >
              <Phone className="w-3 h-3" />
              <span>Contact Store</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E8ECE9]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[11px] text-[#171717]">
                RK
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#171717] block">
                  Ramesh Kumar (Delivery Partner)
                </span>
                <span className="text-[10px] text-[#666666] block">
                  Verified Local Runner • Bajaj Chetak EV
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#078B35]">
              ⭐ 4.9
            </span>
          </div>
        </div>

        {/* Review Modal Triggered After Delivery */}
        {showReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#E8ECE9] space-y-3 animate-in zoom-in-95 duration-150">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-[#171717]">
                  How was your 10-minute delivery?
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Rate {order.shopName} & your delivery partner
                </p>
              </div>

              {submitted ? (
                <div className="py-6 text-center space-y-2 text-[#078B35] font-bold text-xs">
                  <CheckCircle2 className="w-7 h-7 mx-auto" />
                  <span>Thank you for supporting local stores!</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#171717] text-center mb-1">
                      Store Packaging & Quality
                    </label>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setShopRating(s)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= shopRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#171717] text-center mb-1">
                      Delivery Speed & Service
                    </label>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRiderRating(s)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= riderRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Leave a short appreciation note for the store..."
                      rows={2}
                      className="w-full bg-[#F8F9FA] border border-[#E8ECE9] rounded-xl p-2 text-xs text-[#171717] placeholder:text-[#666666] focus:outline-none focus:border-[#078B35]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit Review</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

