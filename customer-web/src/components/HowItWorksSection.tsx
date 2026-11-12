"use client";

import React from "react";
import { MapPin, Search, ShoppingBag, Truck, ArrowRight } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "1. Set Your Location",
      desc: "Choose your area (e.g. Kukas, Jaipur)",
      icon: MapPin,
      color: "bg-emerald-50 text-[#078B35]",
    },
    {
      step: "2. Explore & Shop",
      desc: "Find local stores & products you need",
      icon: Search,
      color: "bg-amber-50 text-amber-700",
    },
    {
      step: "3. Place Your Order",
      desc: "Add to cart and checkout easily",
      icon: ShoppingBag,
      color: "bg-rose-50 text-rose-700",
    },
    {
      step: "4. Get It Delivered",
      desc: "Receive at your doorstep (In Minutes, 1 Day or Pan India)",
      icon: Truck,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <section className="space-y-3.5 select-none">
      <div className="flex items-center gap-2">
        <span className="text-xl">✨</span>
        <h3 className="text-base sm:text-lg font-extrabold text-[#2D2319]">
          How ServoLocal Works?
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="relative p-4 rounded-2xl bg-white border border-[#EFECE6] flex items-center gap-3 shadow-2xs group hover:border-[#078B35]/30 transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-extrabold text-[#2D2319] leading-tight">
                  {s.step}
                </h5>
                <p className="text-[11px] text-[#8C7663] leading-snug mt-0.5">
                  {s.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 z-10 w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

