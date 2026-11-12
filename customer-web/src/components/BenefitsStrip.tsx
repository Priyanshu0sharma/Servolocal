"use client";

import React from "react";
import { Truck, Store, Tag, ShieldCheck, Headphones } from "lucide-react";

export default function BenefitsStrip() {
  const benefits = [
    {
      title: "Fast & Flexible Delivery",
      desc: "10-Min, 1-Day or Pan-India",
      icon: Truck,
      color: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "Support Local Shops",
      desc: "Direct to neighbourhood sellers",
      icon: Store,
      color: "text-amber-700 bg-amber-50",
    },
    {
      title: "Best Deals & Offers",
      desc: "Everyday local savings",
      icon: Tag,
      color: "text-orange-700 bg-orange-50",
    },
    {
      title: "Verified Stores",
      desc: "100% genuine products",
      icon: ShieldCheck,
      color: "text-blue-700 bg-blue-50",
    },
    {
      title: "Helpful Support",
      desc: "24x7 local resolution",
      icon: Headphones,
      color: "text-purple-700 bg-purple-50",
    },
  ];

  return (
    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EFECE6] shadow-2xs select-none flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Title Pill matching Mockup */}
      <div className="shrink-0 px-4 py-2 rounded-2xl bg-[#591C13] text-white font-extrabold text-xs sm:text-sm shadow-xs self-start lg:self-auto">
        Why Shop on ServoLocal?
      </div>

      {/* 5 Benefits */}
      <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${b.color}`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-extrabold text-[#2D2319] leading-tight truncate">
                  {b.title}
                </h5>
                <p className="text-[10px] text-[#8C7663] truncate leading-tight">
                  {b.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

