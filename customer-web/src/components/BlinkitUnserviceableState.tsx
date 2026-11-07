"use client";

import { useState } from "react";
import { Store, ChevronRight, CheckCircle2, MessageCircle, MapPin, Truck } from "lucide-react";

interface BlinkitUnserviceableStateProps {
  currentLocality: string;
  onSelectLocality: (locality: string, lat: number, lng: number) => void;
  onSubmitDemand: (phone: string) => Promise<void>;
  onSwitchToPanIndia: () => void;
}

export default function BlinkitUnserviceableState({
  currentLocality,
  onSelectLocality,
  onSubmitDemand,
  onSwitchToPanIndia,
}: BlinkitUnserviceableStateProps) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await onSubmitDemand(phone.trim());
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4 text-center select-none">
      {/* Friendly Blinkit Notification (Image 2 Replica) */}
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
          Hello!
        </h2>
        <h3 className="text-xl sm:text-2xl font-black text-rose-900 tracking-tight">
          It&apos;s not you, it&apos;s us.
        </h3>
        <p className="text-base sm:text-lg font-bold text-rose-800 leading-snug">
          We are not serving this area at the moment.
        </p>
        <p className="text-sm font-semibold text-rose-700/80">
          Sorry for the inconvenience 😔
        </p>
      </div>

      {/* Store Closed Illustration Card (Image 2 Replica) */}
      <div className="w-full bg-[#FFF5F5] border border-rose-100 rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden shadow-xs">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-white border border-rose-200 flex items-center justify-center shadow-md mb-4 relative">
          <Store className="w-12 h-12 text-rose-400" />
          <span className="absolute -top-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
            Store Closed
          </span>
        </div>

        <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto mb-4">
          Instant 15-minute delivery is currently live across our <strong className="text-slate-900">Jaipur & Kukas</strong> service hubs.
        </p>

        {/* 1-Tap Switch to Active Service Hub */}
        <button
          onClick={() => onSelectLocality("Kukas, Jaipur (RIICO / Colleges)", 27.0544, 75.8942)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
        >
          <MapPin className="w-4 h-4" />
          <span>Switch to Kukas, Jaipur (Active Stores)</span>
        </button>
      </div>

      {/* WhatsApp Notify Form */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6 text-left">
        <h4 className="text-xs font-black text-slate-900 mb-1">
          Get notified when our fleet arrives in your street:
        </h4>
        <p className="text-[11px] text-slate-500 mb-3">
          Enter your WhatsApp number to get an instant launch alert & ₹50 welcome discount.
        </p>

        {submitted ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Demand saved! We will ping you on WhatsApp as soon as fleet launches.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter WhatsApp Number"
              required
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A6D1A] text-white font-black text-xs transition-all shrink-0 cursor-pointer shadow-xs"
            >
              {loading ? "Saving..." : "Notify Me"}
            </button>
          </form>
        )}
      </div>

      {/* Quick Navigation Links (Image 2 Replica) */}
      <div className="space-y-2 text-left">
        <button
          onClick={onSwitchToPanIndia}
          className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-800 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Order Pan-India Courier (Delivers in 3-5 Days)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <a
          href="https://wa.me/919999999999"
          target="_blank"
          rel="noreferrer"
          className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-800 transition-all shadow-xs block"
        >
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Need help with your previous orders?</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>
      </div>
    </div>
  );
}
