"use client";

import React from "react";
import { Megaphone, ArrowRight } from "lucide-react";

interface AnnouncementBarProps {
  currentLocality: string;
  onOpenLocation: () => void;
}

export default function AnnouncementBar({
  currentLocality,
  onOpenLocation,
}: AnnouncementBarProps) {
  return (
    <div className="bg-[#4E160E] text-[#FFF6EE] text-[11px] sm:text-xs py-2 px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between select-none border-b border-[#3D1009] transition-colors">
      {/* Left: Offer text with Megaphone */}
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 shrink-0">
          <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </span>
        <div className="flex items-center gap-1.5 truncate">
          <strong className="font-bold text-amber-300 shrink-0">Grand Launch Offer!</strong>
          <span className="text-white/90 truncate">Up to 50% OFF on Local Shops</span>
          <span className="hidden md:inline text-white/50">|</span>
          <span className="hidden md:inline text-white/90">Free Delivery on Selected Stores</span>
        </div>
      </div>

      {/* Right: Coverage & Location Link */}
      <button
        type="button"
        onClick={onOpenLocation}
        className="flex items-center gap-1.5 font-semibold text-amber-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-3 group"
        title="Change delivery location"
      >
        <span className="text-sm">🛵</span>
        <span className="hidden sm:inline">Delivering in</span>
        <span className="underline underline-offset-2 max-w-[130px] sm:max-w-[180px] truncate">
          {currentLocality || "Kukas, Jaipur"}
        </span>
        <span>&amp; Beyond</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

