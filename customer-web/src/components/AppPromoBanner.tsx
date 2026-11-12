"use client";

import React, { useState } from "react";
import { Bell, Check, Smartphone } from "lucide-react";

export default function AppPromoBanner() {
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 3000);
  };

  return (
    <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#3D1D13] via-[#4D2417] to-[#2B140D] text-white p-5 sm:p-7 shadow-sm select-none">
      {/* Decorative leaf/ambient glows */}
      <div className="absolute top-0 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left: Phone Mockup & App Logo */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/servolocallogo.jpeg"
              alt="ServoLocal Mobile App"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                ServoLocal App
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase tracking-wide">
                Coming Soon!
              </span>
            </div>
            <p className="text-xs text-amber-100/90 leading-snug">
              Get the Best Local Shopping Experience on Your Phone
            </p>
          </div>
        </div>

        {/* Right: Badges & Notify Me */}
        <div className="flex items-center gap-3">
          {/* App store icons */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Smartphone className="w-4 h-4" />
            <span>Android &amp; iOS</span>
          </div>

          {/* Notify Me Button */}
          <button
            type="button"
            onClick={handleNotifyMe}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#3D1D13] hover:bg-amber-300 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            {notified ? (
              <>
                <Check className="w-4 h-4 text-[#078B35] stroke-[3]" />
                <span className="text-[#078B35]">We&apos;ll notify you!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 stroke-[2.5]" />
                <span>Notify Me</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
