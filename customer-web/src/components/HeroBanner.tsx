"use client";

import React from "react";

interface HeroBannerProps {
  onExploreStores?: () => void;
}

export default function HeroBanner({ onExploreStores }: HeroBannerProps) {
  return (
    <section className="w-full space-y-3 select-none">
      <div
        onClick={onExploreStores}
        className="w-full rounded-[22px] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group bg-gradient-to-r from-[#075C2A] to-[#078B35]"
      >
        <img
          src="/assets/hero_banner_hd.png"
          alt="Daily Needs from Your Local Stores - Nearby Stores, Fast Delivery, Trusted Stores"
          className="w-full h-auto object-cover block group-hover:scale-[1.01] transition-transform duration-300"
        />
      </div>

      {/* 3 Carousel Dots Matching Reference UI */}
      <div className="flex justify-center items-center gap-1.5 pt-0.5">
        <span className="w-6 h-1.5 bg-[#078B35] rounded-full transition-all" />
        <span className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full" />
        <span className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full" />
      </div>
    </section>
  );
}

