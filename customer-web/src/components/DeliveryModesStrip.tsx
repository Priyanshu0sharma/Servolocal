"use client";

import React from "react";
import { Zap, Calendar, Globe, ArrowRight, Check } from "lucide-react";

export type DeliveryMode = "MINUTES" | "ONE_DAY" | "PAN_INDIA";

interface DeliveryModesStripProps {
  activeMode: DeliveryMode;
  onSelectMode: (mode: DeliveryMode) => void;
}

export default function DeliveryModesStrip({
  activeMode,
  onSelectMode,
}: DeliveryModesStripProps) {
  const modes = [
    {
      id: "MINUTES" as DeliveryMode,
      title: "In Minutes",
      subtitle: "Need it Now? Get it Super Fast!",
      badge: "⚡ 10-15 Min",
      icon: Zap,
      accentColor: "from-emerald-500/10 to-emerald-500/5",
      borderActive: "border-[#078B35] ring-2 ring-[#078B35]/20 shadow-md",
      textColor: "text-[#075C2A]",
      badgeBg: "bg-[#078B35] text-white",
      emoji: "🛵",
    },
    {
      id: "ONE_DAY" as DeliveryMode,
      title: "In 1 Day",
      subtitle: "Local Shops & City Delivery",
      badge: "📅 Same Day / 24h",
      icon: Calendar,
      accentColor: "from-amber-500/10 to-amber-500/5",
      borderActive: "border-amber-500 ring-2 ring-amber-500/20 shadow-md",
      textColor: "text-amber-800",
      badgeBg: "bg-amber-600 text-white",
      emoji: "📦",
    },
    {
      id: "PAN_INDIA" as DeliveryMode,
      title: "Pan India",
      subtitle: "Shop Anywhere Across India",
      badge: "🌐 Express Courier",
      icon: Globe,
      accentColor: "from-purple-500/10 to-purple-500/5",
      borderActive: "border-purple-600 ring-2 ring-purple-600/20 shadow-md",
      textColor: "text-purple-900",
      badgeBg: "bg-purple-600 text-white",
      emoji: "✈️",
    },
  ];

  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center gap-2">
        <h3 className="text-sm sm:text-base font-bold text-[#2D2319] flex items-center gap-1.5">
          <span>Choose Delivery Mode</span>
          <span className="text-xs font-normal text-[#8C7663]">That Suits You</span>
        </h3>
        <span className="text-sm text-[#8C7663]">⤷</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {modes.map((m) => {
          const isSelected = activeMode === m.id;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`relative p-3.5 sm:p-4 rounded-2xl bg-white border transition-all cursor-pointer flex items-center justify-between group overflow-hidden ${
                isSelected
                  ? `${m.borderActive} bg-gradient-to-br ${m.accentColor}`
                  : "border-[#EFECE6] hover:border-gray-300 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* 3D Emoji / Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                    isSelected ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <span>{m.emoji}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm sm:text-base font-extrabold text-[#2D2319] leading-tight truncate">
                      {m.title}
                    </h4>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#078B35] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C7663] truncate mt-0.5 leading-tight">
                    {m.subtitle}
                  </p>
                </div>
              </div>

              {/* Right Arrow / Action pill */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[#2D2319] text-white"
                    : "bg-gray-100 text-gray-500 group-hover:bg-[#2D2319] group-hover:text-white"
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

