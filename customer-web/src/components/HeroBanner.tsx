"use client";

import React from "react";
import { Store, Zap, ShieldCheck, ArrowRight } from "lucide-react";

interface HeroBannerProps {
  onExploreStores?: () => void;
}

export default function HeroBanner({ onExploreStores }: HeroBannerProps) {
  return (
    <section className="w-full space-y-3 select-none">
      <div
        onClick={onExploreStores}
        className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#064e23] via-[#078B35] to-[#0d9f3f] text-white p-6 sm:p-8 md:p-10 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        {/* Subtle Background Glow Circles */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-[#FFD52A]/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Left Content */}
          <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD52A] text-[#064e23] text-xs font-extrabold tracking-wide shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ 10-15 MINS LOCAL DELIVERY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Daily Needs from <br className="hidden sm:inline" />
              <span className="text-[#FFD52A]">Your Local Stores</span>
            </h1>

            <p className="text-xs sm:text-sm text-white/90 max-w-lg leading-relaxed font-normal">
              Order fresh dairy, groceries, snacks &amp; daily staples directly from your trusted neighbourhood stores in Kukas &amp; Amer.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1 text-xs font-semibold text-white/95">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
                <Store className="w-3.5 h-3.5 text-[#FFD52A]" />
                <span>Nearby Stores</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
                <Zap className="w-3.5 h-3.5 text-[#FFD52A]" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFD52A]" />
                <span>Trusted Quality</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="w-full md:w-auto shrink-0 flex justify-center">
            <div className="relative w-48 h-36 sm:w-64 sm:h-44 md:w-80 md:h-52 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 group-hover:scale-102 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80"
                alt="Superfast Quick Commerce Delivery"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-white text-xs font-bold flex items-center justify-between">
                <span>Direct to your doorstep</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Carousel Dots */}
      <div className="flex justify-center items-center gap-1.5 pt-0.5">
        <span className="w-6 h-1.5 bg-[#078B35] rounded-full transition-all" />
        <span className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full" />
        <span className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full" />
      </div>
    </section>
  );
}
